import { useState } from 'react';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import SettingsModal from './components/SettingsModal';
import './index.css';

export default function App() {
  const {
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
  } = useChat();

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={createConversation}
        onDelete={deleteConversation}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <ChatView
        messages={activeConv?.messages || []}
        streaming={streaming}
        onSend={sendMessage}
        onStop={stopStreaming}
        onOpenSettings={() => setSettingsOpen(true)}
        sidebarOpen={sidebarOpen}
        enableThinking={config.enableThinking}
        onToggleThinking={() => setConfig({ ...config, enableThinking: !config.enableThinking })}
      />
      {settingsOpen && (
        <SettingsModal
          config={config}
          onSave={setConfig}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
