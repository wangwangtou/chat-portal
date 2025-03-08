import { FileDataRef } from "./FileData";

export enum Role {
    System = 'system',
    User = 'user',
    Assistant = 'assistant',
}

export enum ChatMessagePartType {
    Text = 'text',
    Image = 'image',
    Data = 'data',
}

export interface ChatMessagePart {
    type: ChatMessagePartType,
    text?: string;
    title?: string;
    data?: any;
    detail?: string;
    image_url?: {
        url: string
    }
}

export type ChatMessageContent = ChatMessagePart[] | string;

export interface ChatCompletionMessage {
    role: Role,
    content: ChatMessageContent;
}

export interface ChatSettings {
    id: number;
    author: string;
    name: string;
    description?: string;
    instructions?: string;
    model: string | null;
    seed?: number | null;
    temperature?: number | null;
    top_p?: number | null;
    showInSidebar?: number;
}

export interface ChatCompletionRequest {
    messages: ChatCompletionMessage[];
    model: string;
    frequency_penalty?: number | null;
    presence_penalty?: number | null;
    logit_bias?: { [token: string]: number } | null;
    logprobs?: boolean | null;
    top_logprobs?: number | null;
    max_tokens?: number | null;
    //   n?: number | null;
    //   response_format?: {
    //     type: 'json_object';
    //   } | null;
    seed?: number | null;
    stop?: string | string[] | null;
    stream?: boolean | null;
    temperature?: number | null;
    top_p?: number | null;
    //   tools?: any[];
    //   tool_choice?: 'none' | 'auto' | {
    //     type: 'function';
    //     function: {
    //       name: string;
    //     };
    //   } | null;
    //   user?: string;
}

export interface ChatCompletion {
    id: string;
    object: string;
    created: number;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    choices: ChatCompletionChoice[];
}

export interface ChatMessage {
    id?: number;
    role: Role;
    messageType?: MessageType;
    content: ChatMessageContent;
    reasoning_content?: string;
    reasoning?: boolean,
    name?: string;
    fileDataRef?: FileDataRef[];
}

export interface ChatCompletionChoice {
    message: ChatMessage;
    finish_reason: string;
    index: number;
}

export function getRole(roleString: string): Role {
    return Role[roleString as keyof typeof Role];
}

export enum MessageType {
    Normal = 'normal',
    Error = 'error',
}

export function getMessageType(messageTypeString: string): MessageType {
    return MessageType[messageTypeString as keyof typeof MessageType];
}