import { useState, useCallback, useRef } from 'react';
import type { Message, Conversation, ApiConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';
import { streamChat, buildMessages } from '../api';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function loadConfig(): ApiConfig {
  try {
    const saved = localStorage.getItem('minimax-config');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem('minimax-conversations');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useChat() {
  const [config, setConfigState] = useState<ApiConfig>(loadConfig);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const activeConv = conversations.find((c) => c.id === activeId) || null;

  const saveConversations = useCallback((convs: Conversation[]) => {
    setConversations(convs);
    localStorage.setItem('minimax-conversations', JSON.stringify(convs));
  }, []);

  const setConfig = useCallback(
    (cfg: ApiConfig) => {
      setConfigState(cfg);
      localStorage.setItem('minimax-config', JSON.stringify(cfg));
    },
    []
  );

  const createConversation = useCallback(() => {
    const conv: Conversation = {
      id: uid(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveConversations([conv, ...conversations]);
    setActiveId(conv.id);
    return conv.id;
  }, [conversations, saveConversations]);

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      saveConversations(next);
      if (activeId === id) setActiveId(next[0]?.id || null);
    },
    [conversations, activeId, saveConversations]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;

      let convId = activeId;
      let convs = [...conversations];
      let conv = convs.find((c) => c.id === convId);

      if (!conv) {
        convId = uid();
        conv = {
          id: convId,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        convs = [conv, ...convs];
        setActiveId(convId);
      }

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      conv.messages = [...conv.messages, userMsg];
      conv.updatedAt = Date.now();

      if (conv.messages.length === 1) {
        conv.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
      }

      const assistantMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      conv.messages = [...conv.messages, assistantMsg];
      saveConversations([...convs]);

      setStreaming(true);
      abortRef.current = new AbortController();

      try {
        const apiMessages = buildMessages(config.systemPrompt, conv.messages.slice(0, -1));
        const stream = streamChat(config, apiMessages);

        let fullContent = '';
        for await (const chunk of stream) {
          fullContent += chunk;
          const updatedConvs = convs.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: fullContent } : m
              ),
            };
          });
          convs = updatedConvs;
          saveConversations(updatedConvs);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          const errorConvs = convs.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: `Error: ${err.message}` }
                  : m
              ),
            };
          });
          saveConversations(errorConvs);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [activeId, conversations, config, streaming, saveConversations]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    config,
    setConfig,
    conversations,
    activeConv,
    activeId,
    setActiveId,
    streaming,
    sidebarOpen,
    setSidebarOpen,
    createConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
  };
}
