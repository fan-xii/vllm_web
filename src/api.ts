import type { ApiConfig, Message } from './types';

export interface StreamChunk {
  type: 'thinking' | 'content';
  text: string;
}

export async function* streamChat(
  config: ApiConfig,
  messages: { role: string; content: string }[]
): AsyncGenerator<StreamChunk, void, unknown> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    stream: true,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  };

  if (config.enableThinking) {
    body.enable_thinking = true;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        // vLLM may return thinking content in reasoning_content field
        if (delta.reasoning_content) {
          yield { type: 'thinking', text: delta.reasoning_content };
        }
        if (delta.content) {
          yield { type: 'content', text: delta.content };
        }
      } catch {
        // skip malformed JSON
      }
    }
  }
}

export function buildMessages(
  systemPrompt: string,
  history: Message[]
): { role: string; content: string }[] {
  const msgs: { role: string; content: string }[] = [];
  if (systemPrompt.trim()) {
    msgs.push({ role: 'system', content: systemPrompt });
  }
  for (const m of history) {
    if (m.role === 'user' || m.role === 'assistant') {
      msgs.push({ role: m.role, content: m.content });
    }
  }
  return msgs;
}
