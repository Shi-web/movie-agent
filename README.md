![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1.2-1C3C3C?logo=langchain&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

# Movie Agent

An AI-powered movie recommendation chatbot that combines a **LangChain agent** (backed by Groq) with real-time data from **The Movie Database (TMDB)**. Users chat in natural language and receive rich movie cards with posters, ratings, and personalized suggestions.

The system is split into three independently deployable services — a React frontend, a Python agent API, and a Node.js tool server — orchestrated via Docker Compose.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────┐
│  FRONTEND  ·  React 19 + Vite + Tailwind CSS            │
│  Nginx reverse-proxies /api/* to the agent              │
│  Port 3000                                              │
└────────────────────────┬────────────────────────────────┘
                         │ POST /api/chat
┌────────────────────────▼────────────────────────────────┐
│  AGENT  ·  Python FastAPI + LangChain + Groq LLM        │
│  Receives questions, reasons with tools, returns answers │
│  Port 8000                                              │
└────────────────────────┬────────────────────────────────┘
                         │ POST /tools/*
┌────────────────────────▼────────────────────────────────┐
│  MCP SERVER  ·  Node.js Express                         │
│  Wraps TMDB API: search, details, similar movies        │
│  Port 4000                                              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│  TMDB API  ·  themoviedb.org                            │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Requirement       | Version  | Notes                            |
| ----------------- | -------- | -------------------------------- |
| **Node.js**       | 20+      | For frontend and MCP server      |
| **Python**        | 3.11+    | For the agent service            |
| **Docker**        | 24+      | Docker Compose V2 included       |
| **TMDB API Key**  | —        | Free at https://www.themoviedb.org/settings/api |
| **Groq API Key**  | —        | Free at https://console.groq.com |

---

## Quick Start (Docker Compose)

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/movie-agent.git && cd movie-agent

# 2. Create your environment file
cp .env.example .env

# 3. Fill in your API keys
#    TMDB_API_KEY=<your-tmdb-key>
#    GROQ_API_KEY=<your-groq-key>

# 4. Build and start all services
docker compose up --build

# 5. Open the app
open http://localhost:3000
```

All three services start on a shared Docker bridge network. The frontend proxies API requests to the agent automatically.

---

## Manual Setup

Run each service in a separate terminal. Make sure `.env` is populated at the repo root before starting.

### MCP Server (Node.js)

```bash
cd mcp-server
npm install
npm run dev          # nodemon hot-reload on port 4000
```

### Agent (Python)

```bash
cd agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

When running locally, set `MCP_SERVER_URL=http://localhost:4000` in `.env`.

### Frontend (React)

```bash
cd frontend
npm install
npm run dev          # Vite dev server on port 5173
```

When running locally, set `VITE_AGENT_URL=http://localhost:8000` in `.env` (or export it before starting Vite).

---

## Environment Variables

| Variable           | Description                                     | Where to Get It                          |
| ------------------ | ----------------------------------------------- | ---------------------------------------- |
| `TMDB_API_KEY`     | API key for The Movie Database                  | https://www.themoviedb.org/settings/api  |
| `GROQ_API_KEY`     | API key for Groq LLM inference                  | https://console.groq.com                 |
| `MCP_SERVER_URL`   | Base URL of the MCP tool server                 | `http://mcp-server:4000` (Docker) or `http://localhost:4000` (local) |
| `AGENT_URL`        | Base URL of the agent API                       | `http://agent:8000` (Docker) or `http://localhost:8000` (local) |
| `VITE_AGENT_URL`   | Agent URL baked into the frontend at build time | `/api` (Docker) or `http://localhost:8000` (local) |

> Copy `.env.example` to `.env` and fill in the required keys before running any service.

---

## Folder Structure

```
movie-agent/
├── docker-compose.yml          # Orchestrates all 3 services
├── .env.example                # Template for environment variables
│
├── frontend/                   # React SPA
│   ├── Dockerfile              # Multi-stage: Node build → Nginx
│   ├── nginx.conf              # Reverse proxy /api → agent
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       └── components/
│           ├── Chat.tsx
│           ├── ChatInput.tsx
│           ├── ChatMessage.tsx
│           ├── MovieCard.tsx
│           ├── Sidebar.tsx
│           └── ToolCallIndicator.tsx
│
├── agent/                      # Python AI agent
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── agent.py                # LangChain agent + Groq LLM
│   ├── tools.py                # HTTP tool wrappers for MCP server
│   └── app/
│       └── main.py             # FastAPI application entry point
│
└── mcp-server/                 # TMDB tool server
    ├── Dockerfile
    ├── package.json
    ├── index.js                # Express routes: search, details, similar
    └── test.http               # Sample requests for REST Client
```

---

## Running Tests

The project currently relies on manual testing via REST Client requests.

**MCP Server** — use the included `mcp-server/test.http` file with the [VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension:

```http
GET http://localhost:4000/tools

POST http://localhost:4000/tools/search_movies
Content-Type: application/json

{ "query": "inception" }
```

**Agent** — verify the health check and chat endpoint:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Recommend a sci-fi movie"}'
```

**Frontend** — start the dev server and open `http://localhost:5173` in a browser.

---

## Deployment

The backend services (MCP server + agent) deploy to **Render** via `render.yaml`, and the frontend deploys to **Vercel** via `frontend/vercel.json`.

### Backend — Render

The repo includes a [`render.yaml`](render.yaml) Blueprint that defines both backend services. Connect your GitHub repo in the Render dashboard and it will pick up the Blueprint automatically.

| Service | Name | Runtime | Start Command |
| ------- | ---- | ------- | ------------- |
| MCP Server | `movie-agent-mcp` | Node | `cd mcp-server && node index.js` |
| Agent | `movie-agent-backend` | Python | `cd agent && uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Environment variables** — set these in the Render dashboard for each service:

| Variable | Service | Value |
| -------- | ------- | ----- |
| `TMDB_API_KEY` | `movie-agent-mcp` | Your TMDB key |
| `GROQ_API_KEY` | `movie-agent-backend` | Your Groq key |
| `MCP_SERVER_URL` | `movie-agent-backend` | Public URL of the MCP service (e.g. `https://movie-agent-mcp.onrender.com`) |

Verify after deploy:

```
https://movie-agent-mcp.onrender.com/health
https://movie-agent-backend.onrender.com/health
```

> **Note:** Render's free tier spins down after inactivity — the first request may take 30-60 s. Use a paid instance or an uptime check to keep services warm for demos.

### Frontend — Vercel

The `frontend/` directory includes a [`vercel.json`](frontend/vercel.json) that configures the Vite build. Import the repo in Vercel and set the **Root Directory** to `frontend`.

**Environment variable** — add in Vercel project settings:

| Variable | Value |
| -------- | ----- |
| `VITE_AGENT_URL` | Public URL of the agent on Render (e.g. `https://movie-agent-backend.onrender.com`) |

The rewrite rule in `vercel.json` sends all routes to `index.html` so client-side routing works.

### Deployment summary

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Vercel     │ HTTP  │  Render          │ HTTP  │  Render      │
│   Frontend   ├──────►│  Agent (Python)  ├──────►│  MCP Server  │──► TMDB API
│   :443       │       │  :$PORT          │       │  :$PORT      │
└──────────────┘       └──────────────────┘       └──────────────┘
```

---

## Tech Stack

| Layer       | Technologies                                    |
| ----------- | ----------------------------------------------- |
| Frontend    | React 19, Vite 6, TypeScript 5.7, Tailwind CSS 3.4, Axios, Nginx |
| Agent       | Python 3.11, FastAPI, LangChain, LangChain-Groq, Pydantic, httpx |
| MCP Server  | Node.js 20, Express 4, Axios, Helmet, CORS      |
| External    | Groq (LLM inference), TMDB (movie data)         |
| DevOps      | Docker Compose, multi-stage builds, Nodemon      |

---

## License

This project is available under the [MIT License](LICENSE).
