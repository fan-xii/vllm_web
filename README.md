# vLLM Web Chat

A sleek, ChatGPT-style web interface for chatting with models served by [vLLM](https://github.com/vllm-project/vllm). Supports streaming responses, multi-turn conversations, and full Markdown rendering with code highlighting.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)

## Features

- **Streaming Responses** — Real-time token-by-token display with the ability to stop generation mid-stream
- **Multi-turn Conversations** — Automatic context maintenance across messages
- **Conversation Management** — Create, switch, and delete conversations from the sidebar; all data persisted in localStorage
- **Markdown Rendering** — Full support for code blocks (with syntax highlighting), tables, lists, blockquotes, and more
- **Configurable Settings** — Adjust base URL, model path, temperature, max tokens, and system prompt via the settings panel
- **Dark Theme** — Clean, modern dark UI inspired by leading chat interfaces
- **Responsive Design** — Works on both desktop and mobile

## Quick Start

### Prerequisites

- Node.js 18+
- A running vLLM server with an OpenAI-compatible API

### Install & Run

```bash
# Clone the repository
git clone <your-repo-url>
cd vllm_web

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Output will be in the `dist/` directory. Serve it with any static file server.

## Configuration

The app connects to a vLLM server via the OpenAI-compatible `/v1/chat/completions` endpoint. You can configure the connection in two ways:

### 1. Via the Settings Panel (Recommended)

Click the gear icon in the top-right corner of the chat interface to open settings:

| Setting | Description | Default |
|---------|-------------|---------|
| **Base URL** | vLLM server API endpoint | `/v1` |
| **Model** | Model name or path as registered in vLLM | — |
| **API Key** | API key (use `EMPTY` if none) | `EMPTY` |
| **Temperature** | Sampling temperature (0–2) | `0.7` |
| **Max Tokens** | Maximum tokens per response | `4096` |
| **System Prompt** | System-level instruction | `You are a helpful assistant.` |

### 2. Via the Vite Dev Server Proxy

During development, the Vite config proxies `/v1` requests to your vLLM server to avoid CORS issues. Edit `vite.config.ts` to set your server address:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'http://<your-vllm-server>:8000',
        changeOrigin: true,
      },
    },
  },
})
```

### 3. Direct Connection (Production)

For production deployments, either:
- Place a reverse proxy (e.g., Nginx) in front of both the web app and vLLM server, or
- Enable CORS on your vLLM server and set the full API URL in settings (e.g., `http://your-server:8000/v1`)

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **marked** for Markdown parsing
- **highlight.js** for code syntax highlighting
- **OpenAI-compatible API** via vLLM

## Project Structure

```
src/
├── api.ts                 # Streaming API client
├── types.ts               # TypeScript type definitions
├── hooks/useChat.ts       # Chat state management hook
├── components/
│   ├── Sidebar.tsx        # Conversation list
│   ├── ChatView.tsx       # Main chat area
│   ├── MessageBubble.tsx  # Message rendering with Markdown
│   ├── InputArea.tsx      # Message input
│   └── SettingsModal.tsx  # Configuration panel
├── App.tsx                # Root component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## License

MIT
