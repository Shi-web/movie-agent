import os
from contextlib import contextmanager
from typing import Any

import httpx
from dotenv import load_dotenv
from groq import RateLimitError
from langchain.agents import create_agent
from langchain_core.messages import AIMessage
from langchain_groq import ChatGroq
from tenacity import retry, stop_after_attempt, wait_exponential

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
# The prompt has two sections: TOOL RULES and OUTPUT FORMATTING.
#
# Tool rules enforce a strict tool-first policy so the agent never
# recommends movies from parametric knowledge alone:
#   - Rule 1 is the hard gate: no search_movies call → no recommendation.
#   - Rule 2 prevents the LLM from "knowing" a movie and skipping the tool.
#   - Rule 3 handles vibe/mood queries by requiring multiple search attempts,
#     which increases coverage since TMDB search is title-based.
#   - Rule 4 forces the search → details two-step so responses have accurate
#     cast/director/rating (not hallucinated).
#   - Rule 5 ensures every reply ends with similar-movie suggestions via tool.
#   - Rule 6 guards against single-attempt failures on ambiguous queries.
#
# Output formatting constraints:
#   - "NEVER show movie IDs" prevents internal TMDB ids from leaking into chat.
#   - "Do not use bold labels" and "weave naturally" stop the LLM from falling
#     back to its default structured-report style (Director: X, Cast: Y, ...).
#   - The 150-word cap keeps responses concise for a chat UI.
#   - The example at the end is a one-shot demonstration — LLMs mimic the tone
#     and structure of concrete examples far more reliably than abstract rules.
SYSTEM_PROMPT = """You are a movie discovery assistant with access to The Movie Database (TMDB).

IMPORTANT RULES YOU MUST FOLLOW:
1. You MUST call the search_movies tool before recommending ANY movie. No exceptions.
2. Never recommend a movie you have not retrieved from a tool call in this conversation.
3. If the user describes a vibe or mood, translate it into 2-3 search queries and call search_movies for each one.
4. After finding candidates via search, call get_movie_details on the top result to get full information.
5. Always end your response with similar movie suggestions using get_similar.
6. If search returns no results, try different search terms — do not give up after one attempt.
You have access to real, live movie data. Use it every single time.

When writing your final response:
- Write in a warm, conversational tone like a knowledgeable friend recommending a movie — not like a database report.
- NEVER show movie IDs to the user, they are internal only.
- Do not use bold labels like *Director:* or *Cast:* — weave that information naturally into the recommendation.
- For the main recommendation, write 3-4 sentences explaining why it fits what the user asked for, mentioning the director and a couple of cast members naturally in the text.
- For similar movies, just list 3 titles with one sentence each — no IDs, no labels.
- Keep the whole response under 150 words.
- Never use bullet points or numbered lists for the main recommendation.

Example of good tone:
'You'd probably love The Martian — Ridley Scott directs Matt Damon as an astronaut stranded on Mars, and it somehow manages to be genuinely funny despite the life-or-death stakes. It has that same epic space scale as Interstellar but way more laughs.'"""


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


@retry(
    retry=lambda retry_state: isinstance(retry_state.outcome.exception(), RateLimitError),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    reraise=True,
)
def _invoke_agent(tools, chat_history_messages):
    """Isolated invocation so tenacity can retry on Groq rate limits without
    re-running the caller's setup/teardown (cache reset, tool-call extraction)."""
    with _without_proxy_env():
        # trust_env=False prevents httpx from picking up leftover proxy
        # vars that _without_proxy_env might not fully clear (e.g. in
        # subprocesses that re-read /etc/environment).
        with httpx.Client(trust_env=False, timeout=30.0) as sync_client:
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",  # Groq free-tier model
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
            return agent.invoke({"messages": chat_history_messages})


def run_agent(message: str, chat_history: list) -> str:
    global _LAST_TOOL_CALLS
    _LAST_TOOL_CALLS = []
    reset_tool_runtime_state()

    tools = [search_movies, get_movie_details, get_similar_movies]

    if not os.environ.get("GROQ_API_KEY"):
        raise RuntimeError("Missing GROQ_API_KEY. Please set it in your environment.")

    try:
        result = _invoke_agent(tools, _format_chat_history(chat_history, message))
    except RateLimitError:
        raise  # Let HTTP layer map to 429
    except Exception as exc:
        raise RuntimeError(_build_runtime_error_message(exc)) from exc

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
