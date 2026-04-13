# Frontend (React + Vite + Tailwind)

Vite-powered React app with Tailwind CSS v4 (`@tailwindcss/vite`).

## Standalone run

From this directory (`frontend/`):

1. Install dependencies:

   ```bash
   npm install
   ```

2. Optional: point the UI at your agent by setting `VITE_AGENT_URL` (defaults can be added in `vite.config.ts` or `.env` as you integrate).

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Docker

From the repository root (after dependencies resolve and the app builds):

```bash
docker build -t movie-agent-ui ./frontend
docker run --rm -p 5173:80 movie-agent-ui
```

The container serves the static build on port 80 inside the container; map host port `5173` to container port `80` to match the repo’s default URL.
