// types/chat.ts

export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  text: string;
  imageUrl?: string | null;
}

export interface Step {
  text: string;
  imageUrl?: string | null;
}

export interface ChatResponse {
  steps?: Step[];
  audioUrl?: string | null;
}