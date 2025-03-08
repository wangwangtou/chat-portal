import {
    TextMessage,
    ImageMessage,
    DataMessage,
    MessageTypedItem,
    MessageItem,
    Message,
    StreamMessage,
    Options,
    IChatServer,
    MessageWithRole,
} from './chatMeta'

class StreamProxy {
    messages: MessageWithRole[];
    firstReturnMsgs: (MessageItem | null)[] = [];
    tasks: ((messages: MessageWithRole[], options?: Options | undefined) => Promise<Message | StreamMessage>)[] = [];
    messageCallbacks: ((message: MessageItem, streamStop?: boolean) => MessageItem)[] = [];
    _taskIndex: number = -1;
    _state: 'none' | 'running' | 'stop' = 'none';
    // 未开始 执行中 结束

    _lastMessage: MessageItem | null;
    _currentMessageIndex: number = -1;
    _tasksMessageIndex: Map<number, number> = new Map();
    _currentTaskRespMessage: Message | StreamMessage | null = null;

    _tempRespMessage: MessageWithRole = { role: 'assistant', content: [] };

    _options: Options | undefined;

    constructor(messages: MessageWithRole[], options: Options | undefined) {
        this.messages = messages;
        this._options = options;
    }

    addTask(firstReturnMsg: MessageItem | null
        , task: (messages: MessageWithRole[], options?: Options | undefined) => Promise<Message | StreamMessage>
        , messageCallback?: (message: MessageItem) => MessageItem) {
        this.firstReturnMsgs.push(firstReturnMsg);
        this.tasks.push(task);
        this.messageCallbacks.push(messageCallback || ((m: MessageItem) => m));
    }

    getTempRespMessage(): MessageWithRole {
        return this._tempRespMessage;
    }

    async stream(): Promise<{ message: MessageItem, stop: boolean, index: number}> {
        if (this._state == 'stop') return { message: this._lastMessage!, stop: true, index: this._currentMessageIndex };
        if (this._state == 'none') {
            this._taskIndex += 1;
            this._currentMessageIndex += 1;
            this._tasksMessageIndex.set(this._taskIndex, this._currentMessageIndex);
            const currentTask = this.tasks[this._taskIndex];
            if (!currentTask) {
                this._state = 'stop';
                return { message: this._lastMessage!, stop: true, index: this._currentMessageIndex };
            }
            const firstReturnMsg = this._lastMessage = this.firstReturnMsgs[this._taskIndex];
            if (firstReturnMsg) {
                this._state = 'running';
                return { message: firstReturnMsg, stop: false, index: this._currentMessageIndex };
            }
            this._state = 'running';
            this._currentTaskRespMessage = await currentTask(
                this._taskIndex == 0 ? this.messages : ([] as MessageWithRole[]).concat(this.messages, [this._tempRespMessage])
                , { stream: this._options?.stream });
            return this.stream();
        }
        // running
        const messageCallback = this.messageCallbacks[this._taskIndex];
        if (this._currentTaskRespMessage) {
            if (typeof this._currentTaskRespMessage == 'function') {
                const { message, stop, index } = await this._currentTaskRespMessage();
                this._currentMessageIndex = this._tasksMessageIndex.get(this._taskIndex)! + index;
                if (typeof message == 'string' || message.type == 'text' ) {
                    if (!(this._tempRespMessage.content as MessageItem[])[this._currentMessageIndex]) {
                        (this._tempRespMessage.content as MessageItem[])[this._currentMessageIndex] = { type: 'text', content: typeof message == 'string' ? message : message.content };
                    } else {
                        ((this._tempRespMessage.content as MessageItem[])[this._currentMessageIndex] as TextMessage).content += typeof message == 'string' ? message : message.content;
                    }
                } else {
                    (this._tempRespMessage.content as MessageItem[])[this._currentMessageIndex] = message;
                }
                this._lastMessage = messageCallback(message, stop);
                if (stop) {
                    this._state = 'none';
                    return { message: this._lastMessage, stop: this.tasks.length == this._taskIndex + 1, index: this._currentMessageIndex };
                }
                return { message: this._lastMessage, stop: false, index: this._currentMessageIndex };
            } else {
                if (Array.isArray(this._currentTaskRespMessage)) {
                    const index = this._tasksMessageIndex.get(this._taskIndex)! - this._currentMessageIndex;
                    (this._tempRespMessage.content as MessageItem[]).push(this._currentTaskRespMessage[index]);
                    if (index >= this._currentTaskRespMessage.length) {
                        this._state = 'none';
                        this._currentMessageIndex++;
                        this._lastMessage = messageCallback(this._currentTaskRespMessage[index]);
                        return { message: this._lastMessage, stop: false, index: this._currentMessageIndex };
                    }
                    this._currentMessageIndex++;
                    this._lastMessage = messageCallback(this._currentTaskRespMessage[index]);
                    return { message: this._lastMessage, stop: false, index: this._currentMessageIndex };
                } else {
                    (this._tempRespMessage.content as MessageItem[]).push(this._currentTaskRespMessage);
                    this._state = 'none';
                    this._lastMessage = messageCallback(this._currentTaskRespMessage);
                    return { message: this._lastMessage, stop: this.tasks.length == this._taskIndex + 1, index: this._currentMessageIndex };
                }
            }
        } else {
            const currentTask = this.tasks[this._taskIndex];
            const message = await currentTask(
                this._taskIndex == 0 ? this.messages : ([] as MessageWithRole[]).concat(this.messages, [this._tempRespMessage])
                , { stream: this._options?.stream });
            if (typeof message == 'function' || Array.isArray(message)) {
                this._currentTaskRespMessage = message;
                return this.stream();
            } else {
                this._state = 'none';
                this._lastMessage = messageCallback(message);
                (this._tempRespMessage.content as MessageItem[]).push(message);
                return { message: this._lastMessage, stop: this.tasks.length == this._taskIndex + 1, index: this._currentMessageIndex };
            }
        }
    }
}

export {
    StreamProxy
}

export default StreamProxy;