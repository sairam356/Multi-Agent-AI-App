# Multi-Agent AI App

A full-stack multi-agent AI chat application built with **Google ADK (TypeScript)** and **Azure OpenAI**. It demonstrates a real-world sequential agent pipeline — Planner → Executor → Reviewer — with live streaming via Server-Sent Events (SSE).

---

## What It Does

Every user message is processed by **three specialized AI agents in sequence**:

| Agent | Role |
|-------|------|
| **Planner** | Breaks the user request into a structured step-by-step plan |
| **Executor** | Carries out each step, invoking tools (fetch data, calculate) as needed |
| **Reviewer** | Synthesizes both outputs into a clean, user-friendly final answer |

The UI shows each agent's live status (`Active → Done`) as the pipeline runs.

---

## Screenshot

![Multi-Agent AI Chat UI](screenshots/Screenshot%202026-02-20%20093124.png)

*The agent status bar shows Planner → Executor → Reviewer, all DONE after processing a productivity question.*

---

## Architecture

```
my-multi-agent-app/
├── packages/
│   ├── backend/          # Node.js + Express + TypeScript
│   │   └── src/
│   │       ├── agents/   # Planner, Executor, Reviewer + tools
│   │       ├── models/   # AzureOpenAiLlm (custom ADK model adapter)
│   │       ├── routes/   # /api/stream (SSE) + /api/chat (REST)
│   │       └── server.ts
│   └── frontend/         # React 19 + Vite + TypeScript
│       └── src/
│           ├── components/  # ChatWindow, MessageBubble, AgentStatusBar
│           ├── hooks/       # useAgentStream (SSE lifecycle)
│           └── store/       # Zustand chat store
```

---

## Tech Stack

**Backend**
- `Express 5` — HTTP server
- `@google/adk` — Agent Development Kit (SequentialAgent, LlmAgent, FunctionTool, Runner)
- `openai` SDK — Azure OpenAI integration (GPT-4o)
- `TypeScript` + `tsx` for dev, ESM modules

**Frontend**
- `React 19` + `Vite 6`
- `Zustand` — lightweight state management
- Native browser `EventSource` API for SSE streaming
- Zero CSS framework — inline styles

---

## Key Features

- **Sequential 3-agent pipeline** orchestrated by Google ADK's `SequentialAgent`
- **Real-time SSE streaming** — agents stream text as they generate it; the UI updates live
- **Agent status badges** — color-coded live indicators (Idle / Active / Done / Error)
- **Two API modes**: streaming (`GET /api/stream`) and batch (`POST /api/chat`)
- **Built-in tools** available to the Executor: `fetch_data` and `calculate`
- **Session persistence** — in-memory sessions survive across messages within a page session
- **Health check** endpoint at `GET /health`

---

## Getting Started

### Prerequisites
- Node.js 20+
- An Azure OpenAI resource with a deployed model (e.g. `gpt-4o`)

### 1. Configure the Backend

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env`:
```env
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2025-04-01-preview
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 2. Start the Backend

```bash
cd packages/backend
npm install
npm run dev
```

Backend runs at `http://localhost:3001`

### 3. Start the Frontend

```bash
cd packages/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/api/stream?message=...&sessionId=...&userId=...` | SSE stream — fires `agent_status`, `agent_text`, `done`, `error` events |
| `POST` | `/api/chat` | Non-streaming — returns `{ response, sessionId, agentTrace }` |

---

## Agent Pipeline Detail

```
User Message
    │
    ▼
┌─────────┐   outputKey: execution_plan
│ Planner │ ────────────────────────────►
└─────────┘
                                         ┌──────────┐   outputKey: execution_result
                                         │ Executor │ ─────────────────────────────►
                                         └──────────┘
                                                                                     ┌──────────┐
                                                                                     │ Reviewer │ → Final Response
                                                                                     └──────────┘
```

Each agent reads the previous agent's output from ADK session state via `{execution_plan}` / `{execution_result}` template variables.

---

## What This Demonstrates

- How to build a **multi-agent system** using Google ADK TypeScript (`@google/adk`)
- Integrating a **custom LLM** (Azure OpenAI) into ADK via a model adapter class
- **Programmatic tool calling** — defining and registering `FunctionTool` instances
- Streaming agent output over **SSE** from Express to a React frontend
- Managing agent state across pipeline steps using ADK's session system
