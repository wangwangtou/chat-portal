import {
    TextMessage,
    ImageMessage,
    DataMessage,
    MessageTypedItem,
    MessageItem,
    Message,
    StreamMessage,
    MessageWithRole,
    Options,
    IChatServer,
} from '../../../server/chatMeta'

export interface IOpenAIProps {
    model: string; // = 'llm:latest',
    url: string;
    headers: { [key: string]: string };
    parameters: { [key: string]: string };
}

export type UserInputMessage = {
    input: TextMessage;
    extra: ImageMessage | DataMessage | null;
};


export type MessageList = MessageWithRole[];

export type MessageRole = MessageWithRole['role'];

export type {
    TextMessage,
    ImageMessage,
    DataMessage,
    MessageItem,
    Message,
    StreamMessage
}

export interface IChatProps {
    disabled: boolean;
    readOnly: boolean;
    model: string;
    history: MessageList;
    value: string;
    stream: boolean;
  
    completionsFunction: IChatServer['completions'];

    openAIProps: IOpenAIProps;
}

export function isStreamMessage(message: Message | StreamMessage) {
    return typeof message == 'function';
}