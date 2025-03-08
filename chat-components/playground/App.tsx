import React, { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import '../src/style.css'

import { Chat, ChatCompletion, ChatError, ChatMessage, ChatSettings, Conversation, FileDataRef, IChatService, MessageBox, MessageBoxHandles, MessageType, ModelRepos, NotificationService, OpenAILikeChatService, OpenAIModel, Role } from '../src'
import { ScrollToBottomButton } from './ScrollToBottomButton'

function getFirstValidString(...args: (string | undefined | null)[]): string {
    for (const arg of args) {
      if (arg !== null && arg !== undefined && arg.trim() !== '') {
        return arg;
      }
    }
    return '';
  }
function App() {
    const [chatSettings, setChatSettings] = useState<ChatSettings>({
      id: 1,
      name: 'You',
      author: 'You',
      description: '',
      instructions: "You are a helpful assistant.",
      model: 'deepseek-r1-distill-llama-70b'
    });
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const chatSettingsRef = useRef(chatSettings);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const [loading, setLoading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [allowAutoScroll, setAllowAutoScroll] = useState(true);
    const chatService = useRef<IChatService>(new OpenAILikeChatService(
          'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          "sk-aa477f069f234349a1781a09d192ee99"));

    useEffect(() => {
        chatSettingsRef.current = chatSettings;
    }, [chatSettings]);
    const handleUserScroll = (isAtBottom: boolean) => {
        setAllowAutoScroll(isAtBottom);
        setShowScrollButton(!isAtBottom);
    };

    const fetchModelById = async (modelId: string): Promise<OpenAIModel | null> => {
        try {
            const fetchedModel = await ModelRepos.getModelById(modelId);
            return fetchedModel;
        } catch (error) {
            console.error('Failed to fetch model:', error);
            if (error instanceof Error) {
                NotificationService.handleUnexpectedError(error, 'Failed to fetch model.');
            }
            return null;
        }
    };
    const handleModelChange = async (value: string | null) => {
      setChatSettings(chatSettings => ({ ...chatSettings, model: value }));
    };

    const scrollToBottom = () => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.scroll({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    function getTitle(message: string): string {
        let title = message.trimStart(); // Remove leading newlines
        let firstNewLineIndex = title.indexOf('\n');
        if (firstNewLineIndex === -1) {
          firstNewLineIndex = title.length;
        }
        return title.substring(0, Math.min(firstNewLineIndex, 50));
    }

    function startConversation(message: string, fileDataRef: FileDataRef[]) {
        const id = Date.now();
        const timestamp = Date.now();
        let shortenedText = getTitle(message);
        let instructions = getFirstValidString(
          chatSettings?.instructions,
          'You are a helpful assistant.'
        );
        const conversation: Conversation = {
          id: id,
          gid: 1,
          timestamp: timestamp,
          title: shortenedText,
          model: chatSettings?.model,
          systemPrompt: instructions,
          messages: "[]",
        };
        setConversation(conversation);
      }
      const addMessage = (
        role: Role,
        messageType: MessageType,
        message: string,
        fileDataRef: FileDataRef[],
        callback?: (callback: ChatMessage[]) => void
      ) => {
        let content: string = message;
    
        setMessages((prevMessages: ChatMessage[]) => {
          const newMsg: ChatMessage = {
            id: prevMessages.length + 1,
            role: role,
            messageType: messageType,
            content: content,
            fileDataRef: fileDataRef,
          };
          return [...prevMessages, newMsg];
        });
    
        const newMessage: ChatMessage = {
          id: messages.length + 1,
          role: role,
          messageType: messageType,
          content: content,
          fileDataRef: fileDataRef,
        };
        const updatedMessages = [...messages, newMessage];
        if (callback) {
          callback(updatedMessages);
        }
      };
      const clearInputArea = () => {
        messageBoxRef.current?.clearInputValue();
      };

      async function handleStreamedResponse(response: (() => Promise<ChatCompletion>) | undefined) {
        if (response) {
            let res: ChatCompletion;
            let isNew = true;
            do {
              res = await response();
              if (isNew) {
                setMessages(prevMessages => {
                  const message: ChatMessage = {
                    ...res.choices[0].message,
                    id: prevMessages.length + 1,
                    role: Role.Assistant,
                    messageType: MessageType.Normal,
                  };
                  return [
                    ...prevMessages, message
                  ]
                });
              } else {
                setMessages(prevMessages => {
                  const message: ChatMessage = {
                    ...res.choices[0].message,
                    id: prevMessages.length + 1,
                    role: Role.Assistant,
                    messageType: MessageType.Normal,
                  };
                  return [
                    ...prevMessages.slice(0, -1), message
                  ]
                });
              }
              isNew = false;
            } while (res && !OpenAILikeChatService.choisesEnd(res));
        } else {
            console.log('error');
        }
      }
      function sendMessage(updatedMessages: ChatMessage[]) {
        setLoading(true);
        clearInputArea();
        let systemPrompt = getFirstValidString(
          conversation?.systemPrompt,
          chatSettings?.instructions,
          ''
        );
        let model = getFirstValidString(
          conversation?.model,
          chatSettings?.model,
          ''
        );
        let messages: ChatMessage[] = [
          {
            role: Role.System,
            content: systemPrompt
          } as ChatMessage,
          ...updatedMessages
        ];
    
    
        chatService.current.sendMessageStreamed({ } as any, messages, model)
          .then(handleStreamedResponse)
          .catch(err => {
            if (err instanceof ChatError) {
              const message: string = err.message;
              setLoading(false);
              addMessage(Role.Assistant, MessageType.Error, message, []);
            } else {
              NotificationService.handleUnexpectedError(err, 'Failed to send message to openai.');
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }

    const messageBoxRef = useRef<MessageBoxHandles>(null);
    const callApp = (message: string, fileDataRef: FileDataRef[]) => {
        if (!conversation) {
          startConversation(message, fileDataRef);
        }
        setAllowAutoScroll(true);
        addMessage(Role.User, MessageType.Normal, message, fileDataRef, sendMessage);
    };
    const cancelStream = () => {
        chatService.current.cancelStream();
    }

    return (
        <>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React + Chat</h1>
            <Chat chatBlocks={messages}
                onChatScroll={handleUserScroll}
                conversation={conversation}
                systemPrompt={chatSettings?.instructions}
                model={chatSettings?.model}
                onModelChange={handleModelChange}
                onSystemPromptChange={(systemPrompt) => {
                  if (conversation) setConversation(conversation => ({ ...conversation, systemPrompt } as Conversation));
                  setChatSettings(chatSettings => ({ ...chatSettings, instructions: systemPrompt }));
                }}
                allowAutoScroll={allowAutoScroll}
                loading={loading} />
            {showScrollButton && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-10 z-10">
                    <ScrollToBottomButton onClick={scrollToBottom} />
                </div>
            )}
            <MessageBox
                ref={messageBoxRef}
                callApp={callApp}
                cancelStream={cancelStream}
                loading={loading}
                setLoading={setLoading}
                allowImageAttachment={'no'}
            />
        </>
    )
}

export default App
