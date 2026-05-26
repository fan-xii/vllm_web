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
  let inThinkingTag = false;

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

        // Only process thinking content when thinking mode is enabled
        if (config.enableThinking) {
          const thinkingText =
            delta.reasoning_content ??
            delta.thinking_content ??
            delta.reasoning ??
            delta.thinking;

          if (thinkingText) {
            yield { type: 'thinking', text: thinkingText };
          }
        }

        if (delta.content) {
          if (config.enableThinking) {
            // Parse inline <think>...</think> tags when thinking is on
            const { parts, newInTag } = parseThinkTags(delta.content, inThinkingTag);
            inThinkingTag = newInTag;
            for (const part of parts) {
              yield part;
            }
          } else {
            yield { type: 'content', text: delta.content };
          }
        }
      } catch {
        // skip malformed JSON
      }
    }
  }
}

/**
 * Parse content that may contain <think>...</think> inline tags.
 * Some models return thinking wrapped in the content field directly.
 */
function parseThinkTags(
  text: string,
  inTag: boolean
): { parts: StreamChunk[]; newInTag: boolean } {
  const parts: StreamChunk[] = [];
  let remaining = text;
  let currentInTag = inTag;

  while (remaining.length > 0) {
    if (currentInTag) {
      const endIdx = remaining.indexOf('</think>');
      if (endIdx === -1) {
        // Entire remaining text is thinking
        parts.push({ type: 'thinking', text: remaining });
        remaining = '';
      } else {
        parts.push({ type: 'thinking', text: remaining.slice(0, endIdx) });
        remaining = remaining.slice(endIdx + 10); //  length
        currentInTag = false;
      }
    } else {
      const startIdx = remaining.indexOf('<think>');
      if (startIdx === -1) {
        // Entire remaining text is content
        parts.push({ type: 'content', text: remaining });
        remaining = '';
      } else {
        if (startIdx > 0) {
          parts.push({ type: 'content', text: remaining.slice(0, startIdx) });
        }
        remaining = remaining.slice(startIdx + 7); // <think> length
        currentInTag = true;
      }
    }
  }

  return { parts, newInTag: currentInTag };
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
