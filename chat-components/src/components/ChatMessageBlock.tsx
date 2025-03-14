import { JSX } from "react";
import { ChatMessageContent, ChatMessagePartType, Role } from "../models";

import MarkdownBlock from "./MarkdownBlock";
import { useTranslation } from "react-i18next";

interface ChatMessageBlockProps {
    reasoning?: boolean;
    reasoning_content?: string;
    content: ChatMessageContent;
    role: Role;
    loading: boolean;
}

const ChatMessageBlock: React.FC<ChatMessageBlockProps> = ({ reasoning_content, reasoning, content, role, loading }) => {
    const { t } = useTranslation();
    return (
        <div>
            {
                reasoning_content ? 
                    <div>
                        <div className="text-gray-500 text-sm">{t('reasoning')}</div>
                        <MarkdownBlock className="chat-block-content-reasoning border p-2 bg-gray-200" key='reasoning' 
                            markdown={reasoning_content} role={role} loading={!!reasoning}
                            />
                    </div> : null
            }
            {
                reasoning ? null : (
                    typeof content === 'string' ?
                    ( <MarkdownBlock markdown={content} role={role} loading={loading} className={'chat-block-content-inner '} /> ) :
                    content.map((block, index) => {
                        const result: JSX.Element[] = [];
                        if (block.type == ChatMessagePartType.Text) {
                            result.push(
                                <MarkdownBlock key={index} markdown={block.text!} role={role} loading={content.length - 1 === index} />
                            );
                        } else if (block.type == ChatMessagePartType.Image) {
                            // result.push(
                            //     <MarkdownBlock key={index} markdown={block.text!} role={role} loading={loading} />
                            // );
                        } else if (block.type == ChatMessagePartType.Data) {

                        }
                        return result;
                    })
                )
            } 
        </div>
    );
}

export default ChatMessageBlock;