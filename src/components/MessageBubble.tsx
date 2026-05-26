import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import type { Message } from '../types';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

interface Props {
  message: Message;
  streaming?: boolean;
}

export default function MessageBubble({ message, streaming }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [thinkingOpen, setThinkingOpen] = useState(true);

  const html =
    message.role === 'assistant'
      ? marked.parse(message.content || (streaming ? '...' : ''), { renderer }) as string
      : escapeHtml(message.content);

  const thinkingHtml =
    message.thinking
      ? marked.parse(message.thinking, { renderer }) as string
      : '';

  useEffect(() => {
    if (ref.current) {
      ref.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [message.content, message.thinking]);

  return (
    <div className={`message ${message.role}`} ref={ref}>
      <div className="message-avatar">
        {message.role === 'user' ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </div>
      <div className="message-body">
        <div className="message-role">{message.role === 'user' ? 'You' : 'MiniMax'}</div>

        {message.thinking && (
          <div className={`thinking-block ${thinkingOpen ? 'open' : ''}`}>
            <button className="thinking-toggle" onClick={() => setThinkingOpen(!thinkingOpen)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>{streaming ? 'Thinking...' : 'Thinking process'}</span>
            </button>
            <div className="thinking-content">
              <div dangerouslySetInnerHTML={{ __html: thinkingHtml }} />
            </div>
          </div>
        )}

        <div
          className={`message-content ${streaming && message.role === 'assistant' && !message.content && !message.thinking ? 'loading' : ''}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {streaming && message.role === 'assistant' && message.content && (
          <span className="cursor" />
        )}
      </div>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
