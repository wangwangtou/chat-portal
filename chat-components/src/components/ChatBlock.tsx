import React, { ChangeEvent, KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';
import { InformationCircleIcon, PencilSquareIcon, SparklesIcon, UserCircleIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import CopyButton, { CopyButtonMode } from "./CopyButton";
import { ChatMessage, MessageType } from "../models/ChatCompletion";
import ChatMessageBlock from './ChatMessageBlock';
import UserContentBlock from "./UserContentBlock";
import { toText } from '../service';
import { useTranslation } from 'react-i18next';
import { iconProps } from '../svg';

interface ChatBlockProps {
    block: ChatMessage;
    loading: boolean;
    isLastBlock: boolean;
    onChange?: (value: string) => void;
}

const ChatBlock: React.FC<ChatBlockProps> = ({ block, loading, isLastBlock, onChange }) => {
    const { t } = useTranslation();
    const [isEdit, setIsEdit] = useState(false);
    const [editedBlockContent, setEditedBlockContent] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [savedHeight, setSavedHeight] = useState<string | null>(null);

    const errorStyles = block.messageType === MessageType.Error ? {
        backgroundColor: '#F5E6E6',
        borderColor: 'red',
        borderWidth: '1px',
        borderRadius: '8px',
        padding: '10px'
    } : {};


    useEffect(() => {
        if (isEdit) {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(0, 0);
        }
    }, [isEdit]);


    const handleRegenerate = () => {
    }

    const handleEdit = () => {
        if (contentRef.current) {
            setSavedHeight(`${contentRef.current.offsetHeight}px`);
        }
        setIsEdit(true);
        setEditedBlockContent(block.content as string);
    }
    const handleEditSave = () => {
        // todo: notify main to change content block
        onChange?.(editedBlockContent);
        setIsEdit(false);
    }

    const handleEditCancel = () => {
        setIsEdit(false);
    }

    const checkForSpecialKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // const isEnter = (e.key === 'Enter');
        // const isEscape = (e.key === 'Escape');

        // if (isEnter) {
        //     e.preventDefault();
        //     handleEditSave();
        // } else if (isEscape) {
        //     e.preventDefault();
        //     handleEditCancel();
        // }
    };

    const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEditedBlockContent(event.target.value);
    };

    return (
        <div key={`chat-block-${block.id}`}
            className={`group w-full text-gray-800 dark:text-gray-100 border-b border-black/10 dark:border-gray-900/50
            ${block.role === 'assistant' ? 'bg-gray-100 dark:bg-gray-900' : 'bg-white dark:bg-gray-850'}`}>
            <div
                className="text-base p-2 flex lg:px-0 m-auto flex-col">
                <div className="w-full flex">
                    <div className="w-[30px] flex flex-col relative items-end mr-4">
                        <div className="relative flex h-[30px] w-[30px] p-0 rounded-xs items-center justify-center">
                            {block.role === 'user' ? (
                                <UserCircleIcon width={24} height={24} />
                            ) : block.role === 'assistant' ? (
                                <SparklesIcon width={24} height={24} />
                            ) : block.role === 'system' ? (
                                <InformationCircleIcon title={t('systemPrompt')} width={24} height={24} />
                            ) : null}
                        </div>
                    </div>
                    <div className="relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-full">
                        <div id={`message-block-${block.id}`} className="flex grow flex-col gap-3"
                            style={errorStyles}>
                            <div
                                className="min-h-[20px] flex flex-col items-start gap-4">
                                {isEdit ? (
                                    <textarea
                                        spellCheck={false}
                                        tabIndex={0}
                                        ref={textareaRef}
                                        style={{ height: savedHeight ?? undefined, lineHeight: '1.33', fontSize: '1rem' }}
                                        className="border border-black/10 bg-white dark:border-gray-900/50 dark:bg-gray-700 w-full m-0 p-0 pr-7 pl-2 md:pl-0 resize-none bg-transparent dark:bg-transparent  focus:ring-0 focus-visible:ring-0 outline-hidden shadow-none"
                                        onChange={handleTextChange}
                                        onKeyDown={checkForSpecialKey}
                                        value={editedBlockContent}
                                    ></textarea>
                                )
                                    : (
                                        <div ref={contentRef}
                                            className="markdown prose w-full break-words dark:prose-invert light"
                                            style={{ minHeight: '53px' }}>
                                            {block.role === 'user' ? (
                                                <UserContentBlock text={block.content as string} fileDataRef={(block.fileDataRef) ? block.fileDataRef : []} />
                                            ) : (
                                                <ChatMessageBlock reasoning={block.reasoning} reasoning_content={block.reasoning_content} content={block.content} role={block.role}
                                                    loading={loading} />
                                            )}
                                        </div>)}

                            </div>
                        </div>
                    </div>
                </div>
                {!(isLastBlock && loading) && (
                    <div id={`action-block-${block.id}`} className="flex justify-start items-center ml-10">
                        <div className="copy-button">
                            <CopyButton mode={CopyButtonMode.Compact} text={toText(block.content)} />
                        </div>
                        {/*          {block.role === 'assistant' && (
                    <div className="regenerate-button text-gray-400 visible">
                        <button className="flex gap-2" onClick={handleRegenerate}>
                            <ArrowPathRoundedSquareIcon {...iconProps}/>
                        </button>
                    </div>
                  )}*/
                    isEdit ?
                    <>
                        <div className="regenerate-button text-gray-400 visible">
                                    <button className="flex gap-2" onClick={handleEditSave}>
                                        <CheckIcon {...iconProps}/>
                                    </button>
                        </div>
                        <div className="regenerate-button text-gray-400 visible">
                                    <button className="flex gap-2" onClick={handleEditCancel}>
                                        <XMarkIcon {...iconProps}/>
                                    </button>
                        </div>
                    </> :
                    (onChange ? <div className="regenerate-button text-gray-400 visible">
                        <button className="flex gap-2" onClick={handleEdit}>
                            <PencilSquareIcon {...iconProps}/>
                        </button> 
                    </div> : null)
                    }
                </div>
                )}
            </div>
        </div>
    );
};

export default ChatBlock;