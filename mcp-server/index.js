import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env lives at the monorepo root (one level up), not in this package.
// Load it before any module that reads process.env at import time.
const rootEnvPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
import cors from "cors";
import helmet from "helmet";
import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Expose axios on app.locals so integration tests can swap it with a stub
// (e.g. app.locals.axios = mockedAxios) without monkey-patching the module.
app.locals.axios = axios;

// --- Tool manifest ---
// GET /tools returns this JSON so any client (or future MCP-compatible host)
// can discover available tools at runtime instead of hard-coding them.
// The schema follows the Model Context Protocol (MCP) tool format:
//   - name:         unique identifier the agent uses in tool calls
//   - description:  natural-language summary the LLM reads to decide when
//                   to invoke this tool (keep it precise and action-oriented)
//   - input_schema: JSON Schema that both validates incoming requests and
//                   tells the LLM what arguments to provide
// If you add a new tool, add it here AND create a matching POST route below.
const toolsManifest = {
  tools: [
    {
      name: "search_movies",
      description:
        "Search The Movie Database for movies by title. Optionally narrow by release year and/or filter results to a TMDB genre id.",
      input_schema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Title search query.",
          },
          year: {
            type: "integer",
            description: "Optional release year (passed to TMDB search).",
          },
          genre_id: {
            type: "integer",
            description:
              "Optional TMDB genre id; only movies that include this genre are returned.",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_movie_details",
      description:
        "Fetch full movie details from TMDB including top-billed cast, director, genres, runtime, and keywords.",
      input_schema: {
        type: "object",
        properties: {
          movie_id: {
            type: "integer",
            description: "TMDB movie id.",
          },
        },
        required: ["movie_id"],
      },
    },
    {
      name: "get_similar",
      description:
        "Return up to five movies similar to the given TMDB movie id.",
      input_schema: {
        type: "object",
        properties: {
          movie_id: {
            type: "integer",
            description: "TMDB movie id.",
          },
        },
        required: ["movie_id"],
      },
    },
  ],
};

function requireTmdbKey(res) {
  if (!process.env.TMDB_API_KEY) {
    res.status(503).json({ error: "TMDB_API_KEY is not configured" });
    return false;
  }
  return true;
}

// Whitelist only the fields the agent and frontend actually use.
// TMDB responses include 20+ fields per movie; passing them all would
// bloat the LLM's context window and waste tokens on data it ignores.
function mapMovieResult(m) {
  return {
    id: m.id,
    title: m.title,
    overview: m.overview,
    release_date: m.release_date,
    vote_average: m.vote_average,
    poster_path: m.poster_path,
  };
}

function mapTmdbAxiosError(err) {
  if (!axios.isAxiosError(err)) {
    return { status: 500, message: err.message || "Internal Server Error" };
  }
  const status = err.response?.status;
  const data = err.response?.data;
  const message =
    (typeof data?.status_message === "string" && data.status_message) ||
    (Array.isArray(data?.errors) && data.errors[0]) ||
    err.message ||
    "Request to TMDB failed";
  if (status === 404) return { status: 404, message };
  if (status === 401 || status === 403) return { status: 401, message };
  if (status === 400 || status === 422) return { status: 400, message };
  if (status >= 400 && status < 500) return { status, message };
  return { status: status && status >= 500 ? status : 502, message };
}

async function tmdbGet(path, params = {}) {
  return axios.get(`${TMDB_BASE}${path}`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      ...params,
    },
    // Accept every HTTP status so axios never throws on 4xx/5xx.
    // This lets each route handler format its own error response
    // with the TMDB error message instead of a generic axios stack trace.
    validateStatus: () => true,
  });
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({ service: "movie-agent-mcp-server" });
});

app.get("/tools", (_req, res) => {
  res.json(toolsManifest);
});

app.post("/tools/search_movies", async (req, res) => {
  try {
    if (!requireTmdbKey(res)) return;

    const { query, year, genre_id } = req.body ?? {};

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        error: "body.query is required and must be a non-empty string",
      });
    }
    if (year !== undefined && year !== null) {
      if (typeof year !== "number" || !Number.isInteger(year)) {
        return res.status(400).json({
          error: "body.year must be an integer when provided",
        });
      }
    }
    if (genre_id !== undefined && genre_id !== null) {
      if (typeof genre_id !== "number" || !Number.isInteger(genre_id)) {
        return res.status(400).json({
          error: "body.genre_id must be an integer when provided",
        });
      }
    }

    const params = { query: query.trim() };
    if (year !== undefined && year !== null) params.year = year;

    const response = await tmdbGet("/search/movie", params);
    if (response.status >= 400) {
      const message =
        response.data?.status_message ||
        response.data?.errors?.[0] ||
        "TMDB search failed";
      return res.status(response.status >= 500 ? 502 : response.status).json({
        error: message,
      });
    }

    let results = (response.data?.results ?? []).map(mapMovieResult);
    // TMDB's /search/movie endpoint doesn't support genre filtering natively,
    // so we apply it client-side. This is fine for our use case (small result
    // sets of ~20 items) but wouldn't scale for a full discovery API.
    if (genre_id !== undefined && genre_id !== null) {
      const raw = response.data?.results ?? [];
      results = raw
        .filter((m) => Array.isArray(m.genre_ids) && m.genre_ids.includes(genre_id))
        .map(mapMovieResult);
    }

    return res.json(results);
  } catch (err) {
    const { status, message } = mapTmdbAxiosError(err);
    return res.status(status).json({ error: message });
  }
});

app.post("/tools/get_movie_details", async (req, res) => {
  try {
    if (!requireTmdbKey(res)) return;

    const { movie_id } = req.body ?? {};
    if (movie_id === undefined || movie_id === null) {
      return res.status(400).json({ error: "body.movie_id is required" });
    }
    if (typeof movie_id !== "number" || !Number.isInteger(movie_id)) {
      return res.status(400).json({ error: "body.movie_id must be an integer" });
    }

    // append_to_response is a TMDB API feature that bundles multiple
    // sub-resources into a single HTTP call — avoids 3 round trips for
    // movie details + credits + keywords.
    const response = await tmdbGet(`/movie/${movie_id}`, {
      append_to_response: "credits,keywords",
    });

    if (response.status >= 400) {
      const message =
        response.data?.status_message ||
        response.data?.errors?.[0] ||
        "TMDB movie request failed";
      const outStatus =
        response.status === 404 ? 404 : response.status >= 500 ? 502 : response.status;
      return res.status(outStatus).json({ error: message });
    }

    const data = response.data;
    // Only return top 5 cast members — the full list can be 100+ entries
    // and the LLM only needs a few names for a conversational recommendation.
    const credits = data.credits ?? {};
    const cast = Array.isArray(credits.cast) ? credits.cast.slice(0, 5) : [];
    const crew = Array.isArray(credits.crew) ? credits.crew : [];
    const directors = crew.filter((c) => c.job === "Director");
    const director =
      directors.length === 0
        ? null
        : directors.map((d) => d.name).join(", ");

    // Destructure out the raw credits blob — we've already extracted
    // the useful parts (cast + director) into top-level fields.
    const { credits: _c, ...rest } = data;

    const payload = {
      ...rest,
      cast,
      director,
      genres: data.genres ?? [],
      runtime: data.runtime ?? null,
      keywords: data.keywords?.keywords ?? data.keywords ?? [],
    };

    return res.json(payload);
  } catch (err) {
    const { status, message } = mapTmdbAxiosError(err);
    return res.status(status).json({ error: message });
  }
});

app.post("/tools/get_similar", async (req, res) => {
  try {
    if (!requireTmdbKey(res)) return;

    const { movie_id } = req.body ?? {};
    if (movie_id === undefined || movie_id === null) {
      return res.status(400).json({ error: "body.movie_id is required" });
    }
    if (typeof movie_id !== "number" || !Number.isInteger(movie_id)) {
      return res.status(400).json({ error: "body.movie_id must be an integer" });
    }

    const response = await tmdbGet(`/movie/${movie_id}/similar`);

    if (response.status >= 400) {
      const message =
        response.data?.status_message ||
        response.data?.errors?.[0] ||
        "TMDB similar movies request failed";
      const outStatus =
        response.status === 404 ? 404 : response.status >= 500 ? 502 : response.status;
      return res.status(outStatus).json({ error: message });
    }

    const raw = response.data?.results ?? [];
    const five = raw.slice(0, 5).map(mapMovieResult);
    return res.json(five);
  } catch (err) {
    const { status, message } = mapTmdbAxiosError(err);
    return res.status(status).json({ error: message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`MCP server listening on http://0.0.0.0:${port}`);
});
