# Agent (FastAPI + LangChain)

Python API for the movie agent. Uses FastAPI; LangChain dependencies are listed for upcoming agent logic.

## Standalone run

From this directory (`agent/`):

1. Create a virtual environment (recommended):

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Copy the repo root `.env.example` to `.env` at the repo root (or export variables yourself). Set at least `GROQ_API_KEY`, `TMDB_API_KEY`, and `MCP_SERVER_URL` when you wire those features in.

4. Start the server:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Open `http://localhost:8000/docs` for interactive API docs.

## Docker

From the repository root:

```bash
docker build -t movie-agent-api ./agent
docker run --rm -p 8000:8000 --env-file .env movie-agent-api
```
