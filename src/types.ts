export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'dark' | 'light' | 'midnight' | 'dracula';

export interface ApiConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enableThinking: boolean;
  theme: Theme;
}

export const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: '/v1',
  model: '/home/siok/.cache/modelscope/hub/models/MiniMax/MiniMax-M2.7',
  apiKey: 'EMPTY',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'You are a helpful assistant.',
  enableThinking: false,
  theme: 'dark',
};
