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

import {
    StreamProxy
} from './proxy'

const QWEN2_5_3B_CHAT_MODEL = 'qwen2.5-3b-instruct';
import { dashscope as openAI, CODER_MODEL, CHAT_MODEL } from '../client/src/utils/openAICompletions'

async function readFile(file: string): Promise<string> {
    const { default: result } = await import(file + '?raw')
    return result;
}

type PortalTask = {
    taskType: string,
    taskDescription: string
}

type PortalTaskExecutor = (task: PortalTask, messages: MessageWithRole[], options: Options) => Promise<Message | StreamMessage>;

function parseJson(str: string): any {
    try {
        return JSON.parse(str);
    } catch(e) {
        try{
            return new Function('return (' + str + ')')();
        } catch (e2) {}
    }
}

function parseTagResult(str: string, tag: string): any {
    const start = str.indexOf(`<${tag}>`);
    if (start >= 0) {
        const end = str.indexOf(`</${tag}>`, start + tag.length + 2);
        if (end >= 0) {
            return str.substring(start + tag.length + 2, end);
        }
    }
    return null;
}

function readCodePart(str: string, lang: string): string {
    if (!str) return '';
    var start = str.match(/```\w*/);
    if (!start) {
        return str;
    }
    str = str.substring((start.index || 0) + start[0].length);
    var end = str.match(/```/);
    if (!end) {
        return str;
    }
    return str.substring(0, end.index);
}

const parseJsonResult = <T>(result: string): T => {
    return parseJson(readCodePart(result, 'json')) as T;
}

const parseFunctionResult = (result: string, funcName: string): Function => {
    const code = readCodePart(result, 'javascript');
    return new Function(`${code}; return ${funcName}`)();
}

const templateMessage = (messages: MessageWithRole[]) => {
    return messages.map(m => {
        const content = typeof m.content === 'string' ? m.content : (
            Array.isArray(m.content) ? m.content.map(item => {
                return typeof item === 'string' ? item : 
                    (item.type == "text" ? item.content : (item.type == 'data' ? item.title : ''));
            }).join("\n") : (m.content as TextMessage).content
        );
        return `${m.role}: ${content}`;
    }).join('\n\n');
}

const classifier = async (messages: MessageWithRole[]) : Promise<PortalTask[]> => {
    const text = `
# 任务分解

你是一个分类器，需要根据用户的对话信息拆解用户最新对话所希望执行的任务，我们可以帮助用户执行任务，请将拆解后的任务进行输出。

请做到以下要求：
1. 如果可以匹配到多条任务，请逐个按顺序列出。
2. 输出json数组格式，包含任务类型 taskType 和 任务描述 taskDescription。 例 [ { "taskType": "资料搜索", "taskDescription": "我要搜索资料" } ]

## 我们可以帮助用户执行的任务

1. 资料搜索
2. 文档生成和编辑
3. 表格生成和编辑
4. ppt生成和编辑
5. 待办工作

## 用户的对话信息

${templateMessage(messages)}`;
    const result = await openAI([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: text },
    ], { stream: false, model: CHAT_MODEL })
    return parseJsonResult<PortalTask[]>((result as TextMessage).content);
}

const taskSearch: PortalTaskExecutor = async (task, messages, options) => {
    const text = `
# 信息检索

你是一个检索器，根据用户的描述，找到对应的信息。 如果没有提供检索文本，请用通用规则生成对应的信息， 我同时会提供用户的历史对话信息。


## 用户的对话信息

${templateMessage(messages)}

## 用户要检索的内容

${task.taskDescription}
`;
    const result = await openAI([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: text },
    ], { stream: options?.stream, model: CHAT_MODEL })
    return result;
}

const documentCodeGenerater: PortalTaskExecutor = async (task, messages, options) => {
    const text = `
# 代码生成

- 请根据用户对话信息和要求，以及文档管理功能的API，生成对应的javascript代码。

- 生成一个方法，方法名为 documentProcessor ， 该方法传入文档数据，传出处理好的文档数据，如果是生成新文档，直接返回文档数据。

- 请尽量使用用户对话中的信息

- 请注意 markdown 格式 和 文档格式的差异， 不要直接复制 markdown， 请进行转换

## 文档管理功能API

${await readFile('./api/document.md')}

## 在 <CHAT></CHAT> 标签中的是用户的对话信息

<CHAT>
${templateMessage(messages)}
</CHAT>

## 用户对文档的要求

${task.taskDescription}
`;
    const proxy = new StreamProxy([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: text },
    ], { stream: options?.stream });
    proxy.addTask({ type: 'data', title: '文档生成中', data: null }, async (messages: MessageWithRole[]) => {
        const result = await openAI(messages, { stream: options?.stream, model: CODER_MODEL })
        return result;
    }, (message: MessageItem, streamStop?: boolean) => {
        const result = (proxy.getTempRespMessage().content as MessageItem[])[0] as TextMessage;
        if (streamStop) {
            const documentProcessor = parseFunctionResult(result.content, 'documentProcessor');
            const data = documentProcessor({
                payload: {
                    main: [],
                    header: [],
                    footer: [],
                },
                options: {
                }
            });
            return {
                type: 'data',
                title: data.title || 'documentProcessor.docx',
                detail: result.content,
                data: {
                    type: 'Document',
                    ...data,
                }
            };
        }
        return {
            type: 'data',
            title: '文档生成中',
            detail: result.content,
            data: null
        };
    });
    return () => proxy.stream();
}

const documentGenerater: PortalTaskExecutor = async (task, messages, options) => {
    const text = `
# 文档生成

- 请根据用户对话信息和要求，生成对应的文档内容。

- 请用 markdown 格式 进行输出，输出内容 放到 <DOCUMENT></DOCUMENT> 标签内。

- 请用 根据内容输出文档标题， 放到 <DOCUMENT_TITLE></DOCUMENT_TITLE> 标签内。

- 请尽量使用用户对话中的信息， 在 <CHAT></CHAT> 标签中的是用户的对话信息。

- 如果用户需要调整文档格式，请输出用户调整后的格式，用 json 进行输出， 输出内容 放到 <DOCUMENT_STYLE></DOCUMENT_STYLE> 标签内。

## 文档格式JSON说明

${await readFile('./api/document_style.md')}

## CHAT

<CHAT>
${templateMessage(messages)}
</CHAT>

## 用户对文档的要求

${task.taskDescription}
`;
    const proxy = new StreamProxy([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: text },
    ], { stream: options?.stream });
    proxy.addTask({ type: 'data', title: '文档生成中', data: null }, async (messages: MessageWithRole[]) => {
        const result = await openAI(messages, { stream: options?.stream, model: CHAT_MODEL })
        return result;
    }, (message: MessageItem, streamStop?: boolean) => {
        const result = (proxy.getTempRespMessage().content as MessageItem[])[0] as TextMessage;
        if (streamStop) {
            const documentMarkdown = parseTagResult(result.content.substring(result.content.indexOf('</thinking>')), 'DOCUMENT');
            const documentTitle = parseTagResult(result.content.substring(result.content.indexOf('</thinking>')), 'DOCUMENT_TITLE');
            const documentStyle = parseJsonResult(parseTagResult(result.content.substring(result.content.indexOf('</thinking>')), 'DOCUMENT_STYLE'));
            return {
                type: 'data',
                title: documentTitle || 'documentProcessor.docx',
                detail: result.content,
                data: {
                    type: 'Document2',
                    markdown: documentMarkdown,
                    style: documentStyle,
                }
            };
        }
        return {
            type: 'data',
            title: '文档生成中',
            detail: result.content,
            data: null
        };
    });
    return () => proxy.stream();
}

const sheetGenerater: PortalTaskExecutor = async (task, messages, options) => {
    const text = `
# 表格生成

- 请根据用户对话信息和要求，帮用户整理数据，整理成csv格式，并输出到 <SHEET></SHEET> 标签内。

- 请用 根据内容输出文档标题， 放到 <SHEET_TITLE></SHEET_TITLE> 标签内。

- 可以直接使用 office excel 的函数，例如 sum、avg、max、min 等。

- 请尽量使用用户对话中的信息， 在 <CHAT></CHAT> 标签中的是用户的对话信息。

## CHAT

<CHAT>
${templateMessage(messages)}
</CHAT>

## 用户对表格的要求

${task.taskDescription}
`;
    const proxy = new StreamProxy([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: text },
    ], { stream: options?.stream });
    proxy.addTask({ type: 'data', title: '表格生成中', data: null }, async (messages: MessageWithRole[]) => {
        const result = await openAI(messages, { stream: options?.stream })
        return result;
    }, (message: MessageItem, streamStop?: boolean) => {
        const result = (proxy.getTempRespMessage().content as MessageItem[])[0] as TextMessage;
        if (streamStop) {
            const sheetCsv = parseTagResult(result.content.substring(result.content.indexOf('</thinking>')), 'SHEET');
            const sheetTitle = parseTagResult(result.content.substring(result.content.indexOf('</thinking>')), 'SHEET_TITLE');
            return {
                type: 'data',
                title: sheetTitle || 'sheetProcessor.xlsx',
                detail: result.content,
                data: {
                    type: 'Sheet',
                    csv: sheetCsv,
                }
            };
        }
        return {
            type: 'data',
            title: '表格生成中',
            detail: result.content,
            data: null
        };
    });
    return () => proxy.stream();
}

const getTaskExecutor = (taskType: string) => {
    switch (taskType) {
        case '资料搜索':
            return taskSearch;
        case '文档生成和编辑':
            return documentGenerater;
        case '表格生成和编辑':
            return sheetGenerater;
        case 'ppt生成和编辑':
            return taskSearch;
        case '待办工作':
            return taskSearch;
        default:
            return taskSearch;
    }
}

class PortalChatServer implements IChatServer {
    completions: (messages: MessageWithRole[], options?: Options | undefined) => Promise<Message | StreamMessage> = async (messages, options) => {
        const proxy = new StreamProxy(messages, options);

        // 对最新的消息进行分类，判断是否 触发 functioncall
        proxy.addTask({ type: 'data', title: '分析中', data: { type: 'tips' } }, async (messages: MessageWithRole[]) => {
            const clses = await classifier(messages);

            if (clses) {
                clses.forEach(task => {
                    const executor = getTaskExecutor(task.taskType);
                    proxy.addTask(null, async (messages: MessageWithRole[]) => {
                        const msg = await executor(task, messages, { stream: options?.stream });
                        return msg;
                    });
                });
            } else {
                proxy.addTask(null, async (messages: MessageWithRole[]) => {
                    const msg = await openAI(messages, { stream: options?.stream });
                    return msg;
                });
            }
            return { type: 'data', title: '分析完成', data: { type: 'tips' } };
        });
        return () => proxy.stream();
        

        // let index = 0;
        // let currentMessages: MessageItem[] = [];
        // let currentStreamMessage: StreamMessage | null = null;
        // let currentStreamMessageIndex = -1;
        // messages.push({ role: 'assistant', content: currentMessages });

        
        // const result: () => Promise<{ message: MessageItem, stop: boolean, index: number}> = async () => {
        //     if (currentStreamMessage) {
        //         const streamProxyResult = await currentStreamMessage();
        //         streamProxyResult.index += currentStreamMessageIndex;
        //         if (streamProxyResult.stop) {
        //             currentStreamMessage = null;
        //             index = currentStreamMessageIndex + streamProxyResult.index + 1;
        //             currentStreamMessageIndex = -1;
        //         }
        //         return {
        //             message: streamProxyResult.message,
        //             stop: false,
        //             index: streamProxyResult.index,
        //         }
        //     }
        //     if (index > clses.length - 1) return { message: '', stop: true, index: index };
        //     const task = clses[index];
        //     const executor = getTaskExecutor(task.taskType);
        //     const msg = await executor(task, messages, { stream: options?.stream });

        //     if (typeof msg == 'function') {
        //         const streamMessage = msg as StreamMessage;
        //         currentStreamMessage = streamMessage;
        //         const streamProxyResult = await currentStreamMessage();
        //         currentStreamMessageIndex = index++;
        //         streamProxyResult.index += currentStreamMessageIndex;
        //         if (streamProxyResult.stop) {
        //             currentStreamMessage = null;
        //             index = currentStreamMessageIndex + streamProxyResult.index + 1;
        //             currentStreamMessageIndex = -1;
        //         }
        //         return {
        //             message: streamProxyResult.message,
        //             stop: false,
        //             index: streamProxyResult.index,
        //         }
        //     } else {
        //         const item = (Array.isArray(msg) ? msg[0] : msg) as MessageItem;
        //         currentMessages.push(item);
        //         return {
        //             message: item,
        //             stop: false,
        //             index: index++
        //         }
        //     }
        // }
        // return result;
    }
}
export default PortalChatServer

/**
 * Q： 帮我写一个的自我介绍的文档
 * A： 好的，下面是给你的文档。
 *      自我介绍.docx            =>     xxx streamurl => xxxxxxxx steam mode
 * Q： 帮我把标题改成 自我介绍
 * A： 好的，已经帮你修改。
 *      自我介绍.docx            =>     xxx streamurl => xxxxxxxx steam mode
 * Q： 生成一个关于岗位薪资的数据表格 
 * A： 2222
 *      xxxx.xlsx               =>     xxx streamurl => xxxxxxxx steam mode
 * 
 */