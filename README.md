# Local AI

A local-first desktop chat application powered by [Ollama](https://ollama.com). Built with React, TypeScript, and Electron — runs entirely on your machine with no external API calls.

## Features

- Real-time streaming responses
- Conversation history with local persistence
- Switch between installed Ollama models mid-session
- Pull and delete models directly from the UI with live progress
- Markdown rendering with code highlighting, math (LaTeX), Mermaid diagrams, and CJK support
- AI reasoning/thinking block display
- Cross-platform: macOS, Windows, Linux

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Ollama](https://ollama.com/) running locally at `http://localhost:11434`

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the development server (Vite + Electron with HMR)
pnpm run dev
```

## Building

```bash
# Type-check, build React app, and package with electron-builder
pnpm run build
```

Output is placed in `release/<version>/`.

## Commands

| Command | Description |
|---|---|
| `pnpm run dev` | Start dev server with HMR |
| `pnpm run build` | Production build + Electron packaging |
| `pnpm run preview` | Preview the production build |
| `pnpm run lint` | Run Biome lint check |
| `pnpm run format:check` | Check formatting with Biome |
| `pnpm run format:write` | Auto-fix formatting with Biome |

## Architecture

### Stack

| Package | Role |
|---|---|
| `electron` | Desktop runtime |
| `react` + `typescript` | UI layer |
| `vite` | Build tool & dev server |
| `ai` (Vercel AI SDK) | Streaming/chat abstraction |
| `ollama-ai-provider` | Ollama provider for AI SDK |
| `@ai-sdk/react` | `useChat` hook |
| `@tanstack/react-router` | File-based routing |
| `@tanstack/react-query` | Server state (model list) |
| `tailwindcss` | Styling |
| `@biomejs/biome` | Formatter & linter |

### Data Flow

1. User submits a message via `PromptInput`
2. `useChatSession` (`src/hooks/use-chat-session.ts`) handles submission via AI SDK's `useChat`
3. `LocalChatTransport` (`src/utils/local-chat-transport.ts`) calls `streamText()` with the Ollama provider
4. Streamed chunks update the UI in real time
5. The completed conversation is persisted to `localStorage` via `ConversationProvider`

### Project Structure

```
├── electron/                   # Electron main process
│   ├── main.ts                 # Window creation and app lifecycle
│   └── preload.ts              # Secure IPC bridge (contextBridge)
└── src/
    ├── routes/
    │   ├── __root.tsx          # Root layout (sidebar + outlet)
    │   └── index.tsx           # Main chat page
    ├── components/
    │   ├── ui/                 # Shadcn/ui primitives
    │   ├── ai-elements/        # Chat components (Message, PromptInput, etc.)
    │   ├── app-sidebar.tsx     # Conversation list
    │   └── model-manager-dialog.tsx
    ├── hooks/
    │   ├── use-chat-session.ts # Chat orchestration
    │   └── use-ollama-models.ts
    ├── contexts/
    │   └── conversation-context.tsx  # Global state + persistence
    ├── repositories/
    │   └── local-storage-conversation-repository.ts
    └── utils/
        ├── ollama-api.ts       # Ollama REST API wrapper
        └── local-chat-transport.ts
```

## Code Style

Formatted and linted with [Biome](https://biomejs.dev/). Single quotes, no semicolons, 2-space indentation.
