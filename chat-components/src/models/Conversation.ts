export interface Conversation {
    id: number;
    gid: number;
    timestamp: number;
    title: string;
    model: string | null,
    systemPrompt: string,
    messages: string; // stringified ChatMessage[]
    marker?: boolean;
}