import { ChatCompletion, ChatCompletionMessage, ChatCompletionRequest, ChatMessage, ChatMessagePart, ChatMessagePartType, ChatSettings, MessageType, Role } from "../models/ChatCompletion";
import { OpenAIModel } from "../models/Model";
import { ChatError } from "./ChatError";
import { NotificationService } from "./NotificationService";

interface CompletionChunkChoice {
    index: number;
    delta: {
        content: string;
        reasoning_content: string;
    };
    finish_reason: null | string; // If there can be other values than 'null', use appropriate type instead of string.
}

interface CompletionChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: CompletionChunkChoice[];
}

export interface IChatService {
    sendMessage(chatSettings: ChatSettings, messages: ChatMessage[], modelId: string): Promise<ChatCompletion>;
    sendMessageStreamed(chatSettings: ChatSettings, messages: ChatMessage[], modelId: string): Promise<(() => Promise<ChatCompletion>) | undefined>;
    cancelStream(): void;
}

export class ModelRepos {
    static models: OpenAIModel[] = [
        {
            id: 'deepseek-r1-distill-llama-70b',
            object: 'deepseek-r1-distill-llama-70b',
            owned_by: 'dashscope',
            permission: [],

            context_window: 0,
            knowledge_cutoff: '',
            image_support: false,
            preferred: false,
            deprecated: false,
        }
    ];
    static async getModels(): Promise<OpenAIModel[]> {
        return this.models;
    }
    // static async getModelService(modelId: string): Promise<IChatService> {
    //     const model = await this.getModelById(modelId);
    //     if (model) {
    //         return new OpenAILikeChatService(
    //             'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    //             "sk-aa477f069f234349a1781a09d192ee99");
    //     }
    //     throw new ChatError('Model not found', {});
    // }
    static async getModelById(modelId: string): Promise<OpenAIModel | null> {
        return this.models.find(model => model.id === modelId) ?? null;
    }
}

export class OpenAILikeChatService implements IChatService {
    static async mapChatMessagesToCompletionMessages(modelId: string, messages: ChatMessage[]): Promise<ChatCompletionMessage[]> {
        const model = await ModelRepos.getModelById(modelId); // Retrieve the model details
        if (!model) {
            throw new Error(`Model with ID '${modelId}' not found`);
        }

        if (model.image_support) {
            return messages.map((message) => {
                const contentParts: ChatMessagePart[] = [{
                    type: ChatMessagePartType.Text,
                    text: message.content as string
                }];

                if (model.image_support && message.fileDataRef) {
                    message.fileDataRef.forEach((fileRef) => {
                        const fileUrl = fileRef.fileData!.data;
                        if (fileUrl) {
                            const fileType = (fileRef.fileData!.type.startsWith('image')) ? 'image_url' : fileRef.fileData!.type;
                            contentParts.push({
                                type: fileType as ChatMessagePartType,
                                image_url: {
                                    url: fileUrl
                                }
                            });
                        }
                    });
                }
                return {
                    role: message.role,
                    content: contentParts,
                };
            });
        } else {
            return messages.map((message) => {
                return {
                    role: message.role,
                    content: message.content,
                };
            });
        }
    }

    static async createRequestBody(chatSettings: ChatSettings, messages: ChatMessage[], modelId: string): Promise<ChatCompletionRequest> {
        const mappedMessages = await OpenAILikeChatService.mapChatMessagesToCompletionMessages(modelId, messages);
        const requestBody: ChatCompletionRequest = {
            model: modelId,
            messages: mappedMessages,
        };
        if (chatSettings) {
            const { model, temperature, top_p, seed } = chatSettings;
            requestBody.model = model ?? requestBody.model;
            requestBody.temperature = temperature ?? requestBody.temperature;
            requestBody.top_p = top_p ?? requestBody.top_p;
            requestBody.seed = seed ?? requestBody.seed;
        }
        return requestBody;
    }

    static streamedResponse(reader: ReadableStreamDefaultReader<Uint8Array>): () => Promise<CompletionChunk | undefined> {
        let partialDecodedChunk: string = '';
        let stop = false;
        const decoder = new TextDecoder("utf-8");
        const parseChunk = (chunk: string): CompletionChunk | undefined => {
            chunk = chunk.replace(/^data: /, '');
            if (chunk.startsWith('[DONE]')) {
                return;
            }
            return JSON.parse(chunk);
        };
        return async () => {
            if (stop && partialDecodedChunk.length == 0) {
                return;
            }
            while (true) {
                const lineMatch = partialDecodedChunk.match(/\r?\n/);
                if (stop && !lineMatch) {
                    const data = parseChunk(partialDecodedChunk);
                    partialDecodedChunk = '';
                    return data!;
                }
                if (lineMatch) {
                    const lineText = partialDecodedChunk.substring(0, lineMatch.index);
                    partialDecodedChunk = partialDecodedChunk.substring((lineMatch.index || 0) + lineMatch[0].length);
                    if (lineText.trim()) {
                        const data = parseChunk(lineText);
                        stop = typeof data === 'undefined';
                        return data!;
                    }
                } else if (stop) {
                    return;
                }
                const { done, value } = await reader.read();
                stop = done;
                const chunk = decoder.decode(value);
                partialDecodedChunk += chunk;
            }
        };
    }

    static choisesEnd(chatCompletion: ChatCompletion): Boolean {
        return chatCompletion.choices.every(choice => choice.finish_reason === 'stop');
    }


    private endpoint: string = '';
    private apiKey: string = '';
    constructor(endpoint: string, apiKey: string) {
        this.endpoint = endpoint;
        this.apiKey = apiKey;
    }
    async sendMessage(chatSettings: ChatSettings, messages: ChatMessage[], modelId: string): Promise<ChatCompletion> {
        let endpoint = this.endpoint;
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
        };

        const requestBody: ChatCompletionRequest = await OpenAILikeChatService.createRequestBody(chatSettings, messages, modelId)

        const response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new ChatError(err.error.message, err);
        }
        return await response.json();
    }

    private abortController: AbortController | null = null;
    async sendMessageStreamed(chatSettings: ChatSettings, messages: ChatMessage[], modelId: string): Promise<(() => Promise<ChatCompletion>) | undefined> {
        this.abortController = new AbortController();

        let endpoint = this.endpoint;
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
        };

        const requestBody: ChatCompletionRequest = await OpenAILikeChatService.createRequestBody(chatSettings, messages, modelId)
        requestBody.stream = true;

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestBody),
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                NotificationService.handleUnexpectedError(error, 'Stream reading was aborted.');
            } else if (error instanceof Error) {
                NotificationService.handleUnexpectedError(error, 'Error reading streamed response.');
            } else {
                console.error('An unexpected error occurred');
            }
            return;
        }
        if (!response.ok) {
            const err = await response.json();
            throw new ChatError(err.error.message, err);
        }
        if (this.abortController.signal.aborted) {
            // todo: propagate to ui?
            console.log('Stream aborted');
            return; // Early return if the fetch was aborted
        }
        const reader = response.body?.getReader();
        if (!reader) return;
        const chunkResponse = OpenAILikeChatService.streamedResponse(reader);
        const result = {} as ChatCompletion;
        return async () => {
            const chunk = await chunkResponse();
            if (!chunk) return result;
            const { choices, ...resultAttrs } = chunk;
            Object.assign(result, resultAttrs);
            if (!result.choices) {
                result.choices = [];
                choices.forEach(c => {
                    result.choices[c.index] = {
                        index: c.index,
                        message: {
                            role: Role.Assistant,
                            messageType: MessageType.Normal,
                            content: c.delta.content,
                            reasoning_content: c.delta.reasoning_content,
                            reasoning: !c.delta.content,
                        },
                        finish_reason: c.finish_reason!,
                    }
                });
            } else {
                chunk.choices.forEach((c) => {
                    result.choices[c.index].message.content += c.delta.content;
                    result.choices[c.index].message.reasoning_content += c.delta.reasoning_content || '';
                    result.choices[c.index].message.reasoning = !result.choices[c.index].message.content;
                    result.choices[c.index].finish_reason = c.finish_reason!;
                });
            }
            return result;
        };
    }
    cancelStream(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

export class ChatService {
    static cancelStream(): void {
    }
}

// const service = new OpenAILikeChatService(
//     'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
//     "sk-aa477f069f234349a1781a09d192ee99",
// )

// service.sendMessageStreamed({
//     model: null,
//     id: 1,
//     author: 'user',
//     name: 'user',
// }, [
//     {
//         role: Role.User,
//         content: '你好',
//     }
// ], 'deepseek-r1-distill-llama-70b').then(async (response) => {
//     if (response) {
//         let res: ChatCompletion;
//         do {
//             res = await response();
//             console.log('streaming', res);
//         } while (res && !OpenAILikeChatService.choisesEnd(res));
//         console.log('streamEnd', res);
//     } else {
//         console.log('error');
//     }
// });