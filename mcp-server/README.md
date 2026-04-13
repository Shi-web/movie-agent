# MCP server (Express)

Node.js HTTP service used as the MCP-related backend (extend with your MCP protocol or tools as needed).

## Standalone run

From this directory (`mcp-server/`):

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the repo root `.env.example` to **`.env` in the repository root** (one shared file for the whole monorepo). Set `TMDB_API_KEY` (required for tool routes) and optionally `PORT` (defaults to `4000`). The server always loads that root `.env`, even when you run `npm start` from `mcp-server/`.

3. Start:

   ```bash
   npm start
   ```

   For development with automatic restarts (nodemon):

   ```bash
   npm run dev
   ```

4. Check `http://localhost:4000/health` and `GET http://localhost:4000/tools` for the tool manifest.

## Docker

The image does not bundle a `.env` file. Pass variables with `-e` or point at the **repository root** file:

From the repository root:

```bash
docker build -t movie-agent-mcp ./mcp-server
docker run --rm -p 4000:4000 --env-file .env -e PORT=4000 movie-agent-mcp
```
