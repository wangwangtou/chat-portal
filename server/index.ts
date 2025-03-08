// 
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

class ChatServer implements IChatServer {
    completions: (messages: MessageWithRole[], options?: Options | undefined) => Promise<Message | StreamMessage> = async (messages, options) => {
        const resultTemp: Message = [
`Fine, thank u!
# title
\\[
    a=2
\\]

$$a=3$$

$$
a=4
$$

- one 
- two

$$a=6$$

\`\`\`javascript
alert(1);
\`\`\`
`,
            { type: 'image', image_url: 'https://example.com/image.jpg' },
            { type: 'data', title: 'Test.docx', data: { type: 'Word', payload: {
                main: [
                  { value: 'Hello World', size: 10 },
                  { value: '\n', size: 10 },
                  { value: '1111111\n', size: 10 },
                  {
                    level: 'first',
                    type: 'title',
                    value: '',
                    valueList: [
                      { value: 'Hello World', size: 20 }
                    ]
                  }
                ]
              } } },
        ]
        let index = -1;
        let token = -1;

        const loadingItem = (item: MessageTypedItem): MessageTypedItem => {
            if (item.type == 'image') {
                return {
                    type: item.type,
                    image_url: null,
                }
            } else if (item.type == 'data') {
                return {
                    type: item.type,
                    data: null,
                }
            }
            return {
                type: 'data',
                data: null,
            };
        };
        const result: StreamMessage = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (index < resultTemp.length - 1) {
                if (token < 0) {
                    index ++;
                    token = 0;
                }
            }
            const current = resultTemp[index];
            if (typeof current === 'string' || current.type == 'text') {
                let content = (typeof current === 'string' ? current : current.content);
                let contentLen = content.length;
                let len = 2;
                content = content.substring(token, token + len);
                token += len;
                if (token > contentLen) {
                    token = -1;
                }
                return {
                    message: { type: 'text', content },
                    index,
                    stop: index == resultTemp.length - 1 && token < 0
                }
            } else {
                if (token == 0) {
                    token = 1;
                    return {
                        message: loadingItem(resultTemp[index] as MessageTypedItem),
                        index,
                        stop: false
                    }
                } else {
                    token = -1;
                    return {
                        message: resultTemp[index],
                        index,
                        stop: index == resultTemp.length - 1 && token < 0
                    }
                }
            }
        };
        return result;
    };
}

async function run() {
    const server = new ChatServer();
    const streamMessage = await server.completions([
        {
            role: 'user',
            content: [
                'Hello, how are you?',
                { type: 'image', image_url: 'https://example.com/image.jpg' },
                { type: 'data', data: { foo: 'bar' } },
            ]
        }
    ], { stream: true });

    const result: MessageItem[] = [];
    if (typeof streamMessage == 'function') {
        let message: MessageItem, stop: boolean, index: number;
        do {
            ({ message, stop, index } = await streamMessage());
            console.log(message);
            if (index > result.length - 1) {
                result.push(message);
            }
            else {
                if (typeof message != 'string' && message.type == 'text') {
                    (result[index] as TextMessage).content += message.content;
                } else {
                    result[index] = message;
                }
            }
        } while (!stop);

        console.log('result', result);
    }
}

run();


export default new ChatServer();