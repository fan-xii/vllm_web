import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';

interface Props {
  onSend: (content: string) => void;
  onStop: () => void;
  streaming: boolean;
}

export default function InputArea({ onSend, onStop, streaming }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (streaming) {
      onStop();
      return;
    }
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-area">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder="Send a message... (Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className={`send-btn ${streaming ? 'stop' : ''} ${!input.trim() && !streaming ? 'disabled' : ''}`}
          onClick={handleSend}
          disabled={!input.trim() && !streaming}
        >
          {streaming ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
      <div className="input-hint">
        Powered by vLLM &middot; MiniMax-M2.7
      </div>
    </div>
  );
}
