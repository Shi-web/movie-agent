import os
from contextlib import contextmanager
from typing import Any

import httpx
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.messages import AIMessage
from langchain_groq import ChatGroq

try:
    from .tools import (
        get_movie_details,
        get_similar_movies,
        reset_tool_runtime_state,
        search_movies,
    )
except ImportError:
    from tools import get_movie_details, get_similar_movies, reset_tool_runtime_state, search_movies

load_dotenv()

# Tracks tool names invoked during the most recent agent turn. Module-level
# because the LangChain agent owns the execution loop — we can only inspect
# tool calls after the loop finishes by walking the returned message list.
_LAST_TOOL_CALLS: list[str] = []

# --- System prompt design notes ---
# Each line constrains a specific failure mode observed during development:
#   - "Always search before recommending" prevents hallucinated titles/years.
#   - "translate that into concrete search terms" stops the LLM from passing
#     vague mood descriptions (e.g. "cozy rainy day") directly to TMDB search.
#   - "never pass null for optional fields; omit optional fields instead" works
#     around Groq models emitting {year: null} which fails MCP validation.
#   - "always fetch full details for the top result" forces a two-step ReAct
#     loop (search → details) so the response contains accurate cast/director.
#   - The tone directives ("not list-heavy", "flowing paragraphs") exist because
#     LLMs default to bullet-list formatting which felt robotic in a chat UI.
SYSTEM_PROMPT = """You are a movie discovery assistant that helps users find films to watch.
Always search before recommending and never make up movie details.
When a user describes a vibe or mood, translate that into concrete search terms first and call search_movies.
When calling tools, provide only valid JSON arguments and never pass null for optional fields; omit optional fields instead.
After finding candidates, always fetch full details for the top result before giving a recommendation.
End every response with 2-3 similar movie suggestions.
Keep responses conversational and natural, not list-heavy.
Write like a friendly movie-loving person, not a database report.
Prefer short flowing paragraphs over bullet points or numbered lists unless the user explicitly asks for a list.
Reference why a movie matches the user's vibe in natural language, and avoid robotic labels like 'Option 1' or 'Candidate 2'."""


def _format_chat_history(chat_history: list[Any], message: str) -> list[dict[str, str]]:
    # Accepts two history formats so the frontend doesn't have to conform to one:
    #   - dict style:  {"role": "user", "content": "..."}
    #   - tuple style: ("user", "...")
    # Both are normalised into the dict format LangChain expects.
    formatted: list[dict[str, str]] = []
    for item in chat_history:
        if isinstance(item, dict):
            role = str(item.get("role", "user")).lower()
            content = str(item.get("content", "")).strip()
            if role in {"user", "assistant"} and content:
                formatted.append({"role": role, "content": content})
        elif isinstance(item, (tuple, list)) and len(item) == 2:
            role, content = item
            role_text = str(role).lower()
            content_text = str(content).strip()
            if role_text in {"user", "assistant"} and content_text:
                formatted.append({"role": role_text, "content": content_text})

    formatted.append({"role": "user", "content": message})
    return formatted


def _build_runtime_error_message(exc: Exception) -> str:
    parts = [f"{type(exc).__name__}: {exc}"]
    cause = exc.__cause__
    if cause is not None:
        parts.append(f"cause={type(cause).__name__}: {cause}")

    full_text = " | ".join(parts).lower()
    if "proxyerror" in full_text or "403 forbidden" in full_text:
        return (
            "Model request failed due to proxy/network restrictions (HTTP 403 via proxy). "
            "Check HTTP_PROXY/HTTPS_PROXY settings or network policy for Groq API access."
        )
    if "apiconnectionerror" in full_text or "connection error" in full_text:
        return "Model request failed due to network connectivity to Groq API."
    return "Agent runtime failed: " + " | ".join(parts)


# Corporate networks / Docker-in-Docker setups often inject HTTP_PROXY vars
# that break direct HTTPS calls to api.groq.com. This context manager
# temporarily strips proxy env vars so the httpx client connects directly.
@contextmanager
def _without_proxy_env():
    proxy_keys = [
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
        "http_proxy",
        "https_proxy",
        "all_proxy",
    ]
    saved = {key: os.environ.get(key) for key in proxy_keys}
    for key in proxy_keys:
        os.environ.pop(key, None)

    current_no_proxy = os.environ.get("NO_PROXY", "")
    required_hosts = ["localhost", "127.0.0.1", "api.groq.com"]
    merged = [entry.strip() for entry in current_no_proxy.split(",") if entry.strip()]
    for host in required_hosts:
        if host not in merged:
            merged.append(host)
    os.environ["NO_PROXY"] = ",".join(merged)

    try:
        yield
    finally:
        for key, value in saved.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def run_agent(message: str, chat_history: list) -> str:
    global _LAST_TOOL_CALLS
    _LAST_TOOL_CALLS = []
    reset_tool_runtime_state()

    tools = [search_movies, get_movie_details, get_similar_movies]

    if not os.environ.get("GROQ_API_KEY"):
        raise RuntimeError("Missing GROQ_API_KEY. Please set it in your environment.")

    last_exc: Exception | None = None
    # Fallback chain: try the primary model first; if Groq returns a transient
    # error (rate limit, model unavailable), fall through to the next candidate.
    # The for/else pattern means the else block runs only if no model succeeded.
    model_candidates = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"]
    for model_name in model_candidates:
        try:
            with _without_proxy_env():
                # trust_env=False prevents httpx from picking up leftover proxy
                # vars that _without_proxy_env might not fully clear (e.g. in
                # subprocesses that re-read /etc/environment).
                with httpx.Client(trust_env=False, timeout=30.0) as sync_client:
                    llm = ChatGroq(
                        model=model_name,
                        temperature=0,
                        http_client=sync_client,
                    )
                    # create_agent wires up a ReAct (Reasoning + Acting) loop:
                    #   1. LLM reads the conversation + system prompt
                    #   2. LLM decides to call a tool OR respond directly
                    #   3. If a tool was called, its output is appended and the
                    #      LLM is invoked again (back to step 1)
                    #   4. Loop ends when the LLM produces a final text response
                    # The tools list tells LangChain which functions the LLM may
                    # invoke; their docstrings become the tool descriptions the
                    # LLM reads to decide which tool fits the user's request.
                    agent = create_agent(model=llm, tools=tools, system_prompt=SYSTEM_PROMPT)
                    result = agent.invoke({"messages": _format_chat_history(chat_history, message)})
                    break
        except Exception as exc:
            last_exc = exc
    else:
        raise RuntimeError(_build_runtime_error_message(last_exc or RuntimeError("Unknown agent failure."))) from last_exc

    # The ReAct loop returns the full message history (system prompt, user
    # message, tool calls, tool results, and final assistant reply). We walk
    # it to extract (a) the last assistant text (= the answer) and (b) which
    # tools were invoked, so the frontend can show "Searched movies..." chips.
    messages = result.get("messages", []) if isinstance(result, dict) else []
    tool_calls: list[str] = []
    output = ""

    for msg in messages:
        if isinstance(msg, AIMessage):
            if msg.content:
                output = str(msg.content)
            for call in msg.tool_calls:
                name = call.get("name")
                if isinstance(name, str):
                    tool_calls.append(name)
        elif isinstance(msg, dict):
            if msg.get("role") == "assistant" and msg.get("content"):
                output = str(msg["content"])
            for call in msg.get("tool_calls", []):
                if isinstance(call, dict):
                    name = call.get("name")
                    if isinstance(name, str):
                        tool_calls.append(name)

    _LAST_TOOL_CALLS = tool_calls
    return output if output else str(result)


def get_last_tool_calls() -> list[str]:
    return list(_LAST_TOOL_CALLS)
