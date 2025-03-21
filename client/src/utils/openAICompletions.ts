import axios from 'axios';
import { IChatServer, Message } from '../components/chatProps';

const http = axios.create({});

const dashscope_url = "/api/v1/services/aigc/text-generation/generation";
const dashscopeOpenAI_url = "/compatible-mode/v1/chat/completions";
const dashscope_api_key = "sk-aa477f069f234349a1781a09d192ee99";

// export const CHAT_MODEL = 'qwen2.5-3b-instruct';
// export const CHAT_MODEL = 'deepseek-r1-distill-qwen-14b'; // 免费额度
export const CHAT_MODEL = 'deepseek-r1-distill-llama-70b'; // 限时免费

export const CODER_MODEL = 'qwen2.5-coder-3b-instruct';

type DashscopeResponse = {
    output: { text: string, thinking_text?: string, finish_reason: string },
    done?: boolean
}

type OpenAIResponse = {
    delta: {
        content: string,
        reasoning_content: string,
    },
    finish_reason: string,
}

const payloadDashscope = async (url: string, data: any, apiKey: string): Promise<DashscopeResponse> => {
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
    return http(url, {
        method: "POST",
        headers: headers,
        data: data,
    }).then((response: any) => {
        const data = response.data as any;
        if (data.output.choices) {
            const choice = data.output.choices[0];
            return {
                output: {
                    text: choice.message && choice.message.content ? choice.message.content : choice.text,
                    finish_reason: choice.finish_reason,
                },
                done: true,
            } as DashscopeResponse;
        }
        return data as DashscopeResponse;
    });
};

const parseStreamLine = (line: string): DashscopeResponse => {
    line = line.replace(/^data: /, '');
    if (line.startsWith('[DONE]')) {
        return { done: true, output: { text: '', finish_reason: 'stop' } }
    }
    const data = JSON.parse(line);
    const response = data.choices[0] as OpenAIResponse;
    return {
        output: {
            text: response.delta.content,
            thinking_text: response.delta.reasoning_content,
            finish_reason: response.finish_reason,
        },
        done: false,
    }
};

const payloadDashscopeStream = async (url: string, data: any, apiKey: string, signal: any): Promise<() => Promise<{ response: DashscopeResponse, stop: boolean }>> => {
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
    const response = await fetch(url, {
        signal,
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            stream: true,
            ...data,
        }),
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('response reader is empty.');
    let text = '';
    let stop = false;
    let lastData: DashscopeResponse | null = null;
    const decoder = new TextDecoder();
    return async (): Promise<{ response: DashscopeResponse, stop: boolean }> => {
        if (stop && text.length == 0)
            return { response: lastData || { output: { text: '', finish_reason: 'stop' } }, stop: true };
        do {
            const lineMatch = text.match(/\r?\n/);
            if (stop && !lineMatch) {
                const data = parseStreamLine(text);
                text = '';
                return {
                    response: data,
                    stop: true,
                };
            }
            if (lineMatch) {
                const lineText = text.substring(0, lineMatch.index);
                text = text.substring((lineMatch.index || 0) + lineMatch[0].length);
                if (lineText.trim()) {
                    const data = parseStreamLine(lineText);
                    stop = data.done === true;
                    return {
                        response: data,
                        stop: stop,
                    };
                }
            }
            const { done, value } = await reader.read();
            stop = done;
            const chunk = decoder.decode(value);
            text += chunk;
        } while (true);
    }
};


function textMessage(message: Message): string {
    let item = Array.isArray(message) ? message[0] : message;
    return typeof item == 'string' ? item : (item.type == 'text' ? item.content : '')
}

export const dashscope: IChatServer['completions'] = async (messages, options) => {
    const stream = !!options?.stream;
    const model = options?.model || CHAT_MODEL;
    const defaultSystem = { role: 'system', content: 'You are a helpful assistant.' };
    if (stream) {
        const result = await payloadDashscopeStream(dashscopeOpenAI_url, {
            model,
            messages: [
                ...(messages[0].role == 'system' ? [] : [defaultSystem]),
                ...messages.map(m => ({
                    role: m.role,
                    content: textMessage(m.content)
                }))
            ]
        }, dashscope_api_key, options.abortSignal);
        let thinkingState: 'thinking' | 'none' | 'thinkend' = 'none';
        return async () => {
            const { response, stop } = await result();
            let content = '';
            if (response.output.text) {
                if (thinkingState == 'thinking') {
                    content = '\n</thinking>\n' + response.output.text;
                    thinkingState = 'thinkend';
                } else {
                    content = response.output.text;
                }
            } else if (response.output.thinking_text) {
                if (thinkingState == 'none') {
                    content = '<thinking>' + response.output.thinking_text;
                    thinkingState = 'thinking';
                } else {
                    content = response.output.thinking_text;
                }
            }
            return {
                message: {
                    type: 'text',
                    content: content,
                },
                stop,
                index: 0
            };
        };
    } else {
        const result = await payloadDashscope(dashscope_url, {
            model,
            input: {
                messages: [
                    ...(messages[0].role == 'system' ? [] : [defaultSystem]),
                    ...messages.map(m => ({
                        role: m.role,
                        content: textMessage(m.content)
                    }))
                ]
            }
        }, dashscope_api_key);
        return {
            type: 'text',
            content: (result.output.thinking_text ? `<thinking>${result.output.thinking_text}</thinking>` : ``) + result.output.text
        };
    }
}