// 
export type TextMessage = { type: 'text', content: string };
export type ImageMessage = { type: 'image', image_url: string | null };
export type DataMessage = { type: 'data', title: string, data: any, detail?: string };

export type MessageTypedItem = TextMessage | ImageMessage | DataMessage;
export type MessageItem = string | MessageTypedItem;

export type MessageRole = 'user' | 'system' | 'assistant';

export type Message = MessageItem | MessageItem[];

export type MessageWithRole = {
    role: MessageRole;
    content: Message;
};


export type StreamMessage = () => Promise<{ message: MessageItem, stop: boolean, index: number}>;

export type Options = {
    stream?: boolean;
    abortSignal?: any;
    model?: string;
}

export interface IChatServer {
    completions: (messages: MessageWithRole[], options?: Options) => Promise<Message | StreamMessage>;
}