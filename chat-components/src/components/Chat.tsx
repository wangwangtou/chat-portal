import React, { useContext, useEffect, useRef, useState } from 'react';
import ChatBlock from "./ChatBlock";
import ModelSelect from "./ModelSelect";
import { OpenAIModel, ChatMessage, Conversation, Role } from "../models";
import { ModelRepos, NotificationService } from "../service";
import { useTranslation } from 'react-i18next';
import Tooltip from "./Tooltip";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface ChatProps {
    chatBlocks: ChatMessage[];
    onChatScroll: (isAtBottom: boolean) => void;
    allowAutoScroll: boolean;
    model: string | null;
    systemPrompt?: string;
    onSystemPromptChange?: (value: string) => void;
    onModelChange: (value: string | null) => void;
    conversation: Conversation | null;
    loading: boolean;
}

const Chat: React.FC<ChatProps> = ({
    chatBlocks, onChatScroll, allowAutoScroll, model, systemPrompt,
    onSystemPromptChange, onModelChange, conversation, loading
}) => {
    const { t } = useTranslation();
    const [models, setModels] = useState<OpenAIModel[]>([]);
    const chatDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ModelRepos.getModels()
            .then(models => {
                setModels(models);
            })
            .catch(err => {
                NotificationService.handleUnexpectedError(err, 'Failed to get list of models');
            });

    }, []);

    useEffect(() => {
        if (chatDivRef.current && allowAutoScroll) {
            chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight;
        }
    }, [chatBlocks]);

    useEffect(() => {
        const chatContainer = chatDivRef.current;
        if (chatContainer) {
            const isAtBottom =
                chatContainer.scrollHeight - chatContainer.scrollTop ===
                chatContainer.clientHeight;

            // Initially hide the button if chat is at the bottom
            onChatScroll(isAtBottom);
        }
    }, []);

    const findModelById = (id: string | null): OpenAIModel | undefined => {
        return models.find(model => model.id === id);
    };

    const formatContextWindow = (context_window: number | undefined) => {
        if (context_window) {
            return Math.round(context_window / 1000) + 'k';
        }
        return '?k';
    }

    const handleScroll = () => {
        if (chatDivRef.current) {
            const scrollThreshold = 20;
            const isAtBottom =
                chatDivRef.current.scrollHeight -
                chatDivRef.current.scrollTop <=
                chatDivRef.current.clientHeight + scrollThreshold;

            // Notify parent component about the auto-scroll status
            onChatScroll(isAtBottom);

            // Disable auto-scroll if the user scrolls up
            if (!isAtBottom) {
                onChatScroll(false);
            }
        }
    };

    return (
        <div ref={chatDivRef} className="chat-container relative flex-1 overflow-auto" onScroll={handleScroll}>
            <div className="chat-container-inner relative flex flex-col items-center text-sm dark:bg-gray-900">
                <div
                    className={`flex w-full items-center justify-center gap-1 p-3 text-gray-500 dark:border-gray-900/50 dark:bg-gray-900 dark:text-gray-300 ${!(conversation === null) ? 'border-b border-black/10' : ''}`}>
                    <div className="chat-top-option flex items-center flex-row gap-1">
                        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {t('模型：')}
                            {conversation && (
                                <span>
                                    <span style={{ marginLeft: '0.25em' }}>{conversation.model}</span>
                                </span>
                            )
                            }
                        </span>
                        {!conversation && (
                            <span className="grow" style={{ width: '50ch' }}>
                                <ModelSelect value={model} onModelSelect={onModelChange} models={models} />
                            </span>
                        )}
                    </div>
                </div>
                {(
                <ChatBlock key={`chat-block-system-prompt`}
                    block={{ role: Role.System, content: conversation?.systemPrompt || systemPrompt || '' }}
                    loading={false}
                    onChange={(text) => {
                        onSystemPromptChange?.(text);
                    }}
                    isLastBlock={false} />
                )}
                {chatBlocks.map((block, index) => (
                    <ChatBlock key={`chat-block-${block.id}`}
                        block={block}
                        loading={index === chatBlocks.length - 1 && loading}
                        isLastBlock={index === chatBlocks.length - 1} />
                ))}
                {/* <div className="w-full h-24 shrink-0"></div> */}
            </div>
        </div>
    );
};

export default Chat;