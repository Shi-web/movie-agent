import os
from typing import Any

import httpx
from langchain_core.tools import tool

# --- Per-request guardrails against LLM tool-call loops ---
# The ReAct loop can call search_movies repeatedly with slight variations
# ("inception", "Inception", "inception 2010") burning TMDB quota and latency.
# These module-level dicts act as a request-scoped cache + rate limiter.
# They are cleared at the start of every user message via reset_tool_runtime_state().
_REQUEST_SEARCH_CACHE: dict[tuple[str, int], str] = {}
_REQUEST_SEARCH_CALL_COUNTS: dict[tuple[str, int], int] = {}
_REQUEST_TOTAL_SEARCH_CALLS = 0

# Movies touched by tools during the current user turn, for rich UI cards.
_UI_MOVIE_ORDER: list[int] = []
_UI_MOVIES_BY_ID: dict[int, dict[str, Any]] = {}
_UI_MOVIE_CAP = 12


def reset_tool_runtime_state() -> None:
    """Called once per user message (before the ReAct loop starts) to reset
    caches and counters so they don't leak between independent chat turns."""
    global _REQUEST_TOTAL_SEARCH_CALLS
    _REQUEST_SEARCH_CACHE.clear()
    _REQUEST_SEARCH_CALL_COUNTS.clear()
    _REQUEST_TOTAL_SEARCH_CALLS = 0
    _UI_MOVIE_ORDER.clear()
    _UI_MOVIES_BY_ID.clear()


def get_collected_ui_movies() -> list[dict[str, Any]]:
    """Structured movie payloads gathered from TMDB tool responses this turn."""
    return [_UI_MOVIES_BY_ID[mid] for mid in _UI_MOVIE_ORDER if mid in _UI_MOVIES_BY_ID][
        :_UI_MOVIE_CAP
    ]


def _normalize_movie_for_ui(movie: dict[str, Any]) -> dict[str, Any] | None:
    mid = movie.get("id")
    if mid is None:
        return None
    try:
        mid = int(mid)
    except (TypeError, ValueError):
        return None

    title = str(movie.get("title") or "Untitled")
    year: str | int | None = movie.get("year")
    rd = movie.get("release_date")
    if year is None and isinstance(rd, str) and len(rd) >= 4:
        year = rd[:4]

    raw_rating = movie.get("vote_average")
    if raw_rating is None:
        raw_rating = movie.get("rating")
    rating: float | None
    try:
        rating = float(raw_rating) if raw_rating is not None else None
    except (TypeError, ValueError):
        rating = None

    poster_path = movie.get("poster_path")
    if isinstance(poster_path, str) and poster_path and not poster_path.startswith("/"):
        poster_path = f"/{poster_path}"
    elif not isinstance(poster_path, str):
        poster_path = None

    overview = movie.get("overview")
    if isinstance(overview, str):
        overview = overview.strip() or None
    else:
        overview = None

    genres: list[str] = []
    g = movie.get("genres")
    if isinstance(g, list):
        for item in g:
            if isinstance(item, dict) and item.get("name"):
                genres.append(str(item["name"]))
            elif isinstance(item, str) and item.strip():
                genres.append(item.strip())

    return {
        "id": mid,
        "title": title,
        "year": year,
        "rating": rating,
        "poster_path": poster_path,
        "overview": overview,
        "genres": genres,
    }


def _merge_ui_movie_entry(existing: dict[str, Any], incoming: dict[str, Any]) -> None:
    for key in ("title", "year", "rating", "poster_path"):
        if existing.get(key) in (None, "") and incoming.get(key) not in (None, ""):
            existing[key] = incoming[key]
    o_in = incoming.get("overview") or ""
    o_ex = existing.get("overview") or ""
    if len(str(o_in)) > len(str(o_ex)):
        existing["overview"] = incoming.get("overview")
    if incoming.get("rating") is not None:
        existing["rating"] = incoming["rating"]
    g_ex = list(existing.get("genres") or [])
    for name in incoming.get("genres") or []:
        if name not in g_ex:
            g_ex.append(name)
    existing["genres"] = g_ex


def _record_ui_movie(raw: dict[str, Any]) -> None:
    normalized = _normalize_movie_for_ui(raw)
    if not normalized:
        return
    mid = normalized["id"]
    if mid not in _UI_MOVIES_BY_ID:
        _UI_MOVIES_BY_ID[mid] = normalized
        _UI_MOVIE_ORDER.append(mid)
    else:
        _merge_ui_movie_entry(_UI_MOVIES_BY_ID[mid], normalized)


def _mcp_server_url() -> str:
    return os.environ["MCP_SERVER_URL"].rstrip("/")


def _post_to_mcp(path: str, payload: dict[str, Any]) -> Any:
    """POST JSON to the MCP server. Returns parsed JSON or an error dict.
    Never raises — callers check for an 'error' key in the returned dict."""
    base_url = _mcp_server_url()
    # Port fallback: during early development the MCP server briefly ran on
    # 3001. If someone still has that in their .env, try 4000 as a second
    # attempt so the app doesn't silently break.
    candidate_base_urls = [base_url]
    if base_url.endswith(":3001"):
        candidate_base_urls.append(base_url.removesuffix(":3001") + ":4000")

    last_error = ""
    for candidate_base_url in candidate_base_urls:
        url = f"{candidate_base_url}{path}"
        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            body = exc.response.text
            return {"error": f"MCP request failed with status {exc.response.status_code}: {body}"}
        except httpx.RequestError as exc:
            last_error = f"Could not reach MCP server at {url}: {exc}"
            continue
        except ValueError:
            return {"error": "MCP server returned a non-JSON response."}

    return {"error": last_error or "Could not reach MCP server."}


# These two extractors are intentionally over-tolerant of response shapes.
# The MCP server currently returns bare arrays and objects, but if someone
# wraps them in {"results": [...]} or {"movie": {...}} these still work.
# This decouples the agent from the exact MCP response envelope.

def _extract_results(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        if isinstance(data.get("results"), list):
            return [item for item in data["results"] if isinstance(item, dict)]
        if isinstance(data.get("movies"), list):
            return [item for item in data["movies"] if isinstance(item, dict)]
    return []


def _extract_object(data: Any) -> dict[str, Any]:
    if isinstance(data, dict):
        for key in ("result", "movie", "details", "data"):
            value = data.get(key)
            if isinstance(value, dict):
                return value
        return data
    return {}


def _format_list(items: Any) -> str:
    if isinstance(items, list):
        return ", ".join(str(item) for item in items) if items else "N/A"
    return str(items) if items else "N/A"


# --- Tool docstring design ---
# The @tool decorator turns each function into a LangChain Tool whose
# .description is set from the docstring. The LLM reads these descriptions
# during the ReAct loop to decide WHICH tool to call and with WHAT arguments.
# Docstrings are phrased as "Use this when..." to give the LLM a clear
# trigger condition rather than a generic capability statement.
# All tools return plain strings (not dicts) because LangChain serialises
# tool outputs into the next prompt as text — structured JSON would waste
# tokens and confuse the model's natural-language reasoning step.

@tool
def search_movies(query: str) -> str:
    """Search for movies using a descriptive query string. Include any relevant details like genre, mood, or era directly in the query string rather than as separate parameters. Examples: 'funny space movies', 'emotional sci-fi 1990s', 'christopher nolan thriller'"""
    global _REQUEST_TOTAL_SEARCH_CALLS
    # Normalise to catch near-duplicate calls ("Inception" vs "inception").
    signature = (query.strip().lower(), 0)
    _REQUEST_SEARCH_CALL_COUNTS[signature] = _REQUEST_SEARCH_CALL_COUNTS.get(signature, 0) + 1
    if signature in _REQUEST_SEARCH_CACHE:
        return _REQUEST_SEARCH_CACHE[signature]
    # Hard cap: after 3 unique searches in one turn, force the LLM to move on
    # to get_movie_details. The return message is worded as an instruction so
    # the LLM treats it as guidance, not an error.
    if _REQUEST_TOTAL_SEARCH_CALLS >= 3:
        return (
            "Search limit reached for this turn. Use the best movie id from previous search "
            "results and call get_movie_details, then call get_similar_movies."
        )

    payload: dict[str, Any] = {"query": query}

    _REQUEST_TOTAL_SEARCH_CALLS += 1
    data = _post_to_mcp("/tools/search_movies", payload)
    if isinstance(data, dict) and data.get("error"):
        message = f"Error searching movies: {data['error']}"
        _REQUEST_SEARCH_CACHE[signature] = message
        return message

    results = _extract_results(data)
    if not results:
        message = (
            "No movies found for that exact search. Try a different search phrase "
            "(for example a broader genre, a different keyword, or no year filter)."
        )
        _REQUEST_SEARCH_CACHE[signature] = message
        return message

    for movie in results[:8]:
        if isinstance(movie, dict):
            _record_ui_movie(movie)

    # Format includes the TMDB id so the LLM can pass it to get_movie_details
    # in the next ReAct iteration without the user having to provide it.
    lines = ["Search results:"]
    for idx, movie in enumerate(results, start=1):
        movie_id = movie.get("id", "N/A")
        title = movie.get("title", "Unknown title")
        release_year = movie.get("year", "N/A")
        lines.append(f"{idx}. {title} ({release_year}) - id: {movie_id}")
    message = "\n".join(lines)
    _REQUEST_SEARCH_CACHE[signature] = message
    return message


@tool
def get_movie_details(movie_id: int) -> str:
    """Use this after selecting a movie id when the user wants rich information such as title, director, cast, genres, and rating."""
    data = _post_to_mcp("/tools/get_movie_details", {"movie_id": movie_id})
    if isinstance(data, dict) and data.get("error"):
        return f"Error fetching movie details: {data['error']}"

    movie = _extract_object(data)
    if not movie:
        return f"No details found for movie id {movie_id}."

    _record_ui_movie(movie)

    title = movie.get("title", "Unknown title")
    director = movie.get("director", "N/A")
    cast = _format_list(movie.get("cast"))
    genres = _format_list(movie.get("genres"))
    rating = movie.get("rating", "N/A")

    return (
        f"Title: {title}\n"
        f"Director: {director}\n"
        f"Cast: {cast}\n"
        f"Genres: {genres}\n"
        f"Rating: {rating}"
    )


@tool
def get_similar_movies(movie_id: int) -> str:
    """Use this when the user asks for recommendations similar to a specific movie id they already chose."""
    data = _post_to_mcp("/tools/get_similar", {"movie_id": movie_id})
    if isinstance(data, dict) and data.get("error"):
        return f"Error fetching similar movies: {data['error']}"

    results = _extract_results(data)
    if not results:
        return f"No similar movies found for movie id {movie_id}."

    for movie in results[:6]:
        if isinstance(movie, dict):
            _record_ui_movie(movie)

    lines = ["Similar movies:"]
    for idx, movie in enumerate(results, start=1):
        title = movie.get("title", "Unknown title")
        release_year = movie.get("year", "N/A")
        similar_id = movie.get("id", "N/A")
        lines.append(f"{idx}. {title} ({release_year}) - id: {similar_id}")
    return "\n".join(lines)
