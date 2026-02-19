# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Local AI is a desktop chat application built with React/TypeScript + Electron that provides a local chatbot interface powered by Ollama. It requires Ollama running on `http://localhost:11434`.

## Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (Vite + Electron with HMR)
pnpm run build        # tsc → vite build → electron-builder (full production build)
pnpm run lint         # Biome lint check
pnpm run format:check # Biome format check
pnpm run format:write # Biome format check and write fix
pnpm run preview      # Preview production build
```

Biome is configured for formatting/linting alongside ESLint. It uses single quotes and no semicolons.

## Architecture

### Electron + React Hybrid

- `electron/main.ts` — Electron main process, creates BrowserWindow, loads React app (dev server in dev mode, built files in prod)
- `electron/preload.ts` — Exposes secure IPC API via `contextBridge`
- `src/main.tsx` — React root, wraps app in `QueryClientProvider` and TanStack Router's `RouterProvider`

### Routing

TanStack Router with file-based routing:
- `src/routes/__root.tsx` — Root layout containing the sidebar
- `src/routes/index.tsx` — Single chat route (the entire UI)

### Data Flow

1. User submits a message via `PromptInput`
2. `useChatSession` hook (in `src/hooks/use-chat-session.ts`) handles submission using AI SDK's `useChat`
3. `LocalChatTransport` (`src/utils/local-chat-transport.ts`) implements the `ChatTransport` interface, calling `streamText()` via the Ollama AI SDK provider
4. Ollama REST API is called at `http://localhost:11434` — see `src/utils/ollama-api.ts`
5. Streamed response chunks update the UI in real time
6. Completed conversation is persisted to `ConversationStore` (`src/stores/conversation-store.ts`)

### State Management

- **ConversationStore** (`src/stores/conversation-store.ts`) — In-memory store using an observer pattern. Stores conversations (id, title, messages, messageModels). No persistence to disk.
- **useConversationStore** (`src/hooks/use-conversation-store.ts`) — React hook that subscribes to the store
- **useOllamaModels** (`src/hooks/use-ollama-models.ts`) — TanStack Query hook for model list with polling; also provides mutations for pull/delete
- **useChatSession** (`src/hooks/use-chat-session.ts`) — Orchestrates the active chat: message list, selected model, submit/regenerate

### Ollama Integration

`src/utils/ollama-api.ts` wraps three REST endpoints:
- `GET /api/tags` — list installed models
- `POST /api/pull` — stream download progress for a model
- `DELETE /api/delete` — remove a model

`src/utils/local-chat-transport.ts` implements AI SDK's `ChatTransport` using `streamText()` from `ai` and `createOllama` from `ollama-ai-provider`.

### UI Structure

- `src/components/ui/` — Shadcn/ui primitives (New York style, Lucide icons)
- `src/components/ai-elements/` — Chat-specific components: `Conversation`, `Message`, `PromptInput`, `Reasoning`, `Shimmer`
- `src/components/app-sidebar.tsx` — Conversation list sidebar
- `src/components/model-manager-dialog.tsx` — Pull/delete models with live progress

Styling uses Tailwind CSS v4 with a Catppuccin dark theme defined via CSS variables in `src/index.css`.

### Path Alias

`@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.json`).

## Key Dependencies

| Package | Purpose |
|---|---|
| `ai` (Vercel AI SDK) | Core streaming/chat abstraction |
| `ollama-ai-provider` | Ollama provider for AI SDK |
| `@ai-sdk/react` | `useChat` hook |
| `@tanstack/react-router` | File-based routing |
| `@tanstack/react-query` | Server state (model list) |
| `electron` | Desktop runtime |
| `vite-plugin-electron` | Electron + Vite integration |
| `@biomejs/biome` | Formatter/linter |
