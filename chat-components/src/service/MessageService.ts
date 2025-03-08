import { ChatMessageContent } from "../models"

export const toText = (content: ChatMessageContent) : string => {
    if (typeof content === 'string') {
        return content
    } else {
        return content.map(item => {
            return typeof item === 'string' ? item : 
                (item.type == "text" ? item.text : (item.type == 'data' ? item.title : ''));
        }).join("\n")
    }
}