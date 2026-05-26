import { useEffect, useRef } from 'react';
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

  const html =
    message.role === 'assistant'
      ? marked.parse(message.content || (streaming ? '...' : ''), { renderer }) as string
      : escapeHtml(message.content);

  useEffect(() => {
    if (ref.current) {
      ref.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [message.content]);

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
        <div
          className={`message-content ${streaming && message.role === 'assistant' && !message.content ? 'loading' : ''}`}
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
