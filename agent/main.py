from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from groq import RateLimitError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from .agent import get_last_tool_calls, run_agent
    from . import keepalive
    from .tools import get_collected_ui_movies
except ImportError:
    from agent import get_last_tool_calls, run_agent
    import keepalive
    from tools import get_collected_ui_movies

load_dotenv()

app = FastAPI(title="Movie Agent API", version="0.1.0")


@app.on_event("startup")
def _start_keepalive() -> None:
    keepalive.start_keepalive()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatHistoryItem] = Field(default_factory=list)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


_RATE_LIMIT_BODY = {
    "error": "rate_limit",
    "message": "Too many requests — please wait 30 seconds and try again.",
}


@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        response = run_agent(
            payload.message,
            [item.model_dump() for item in payload.history],
        )
        return {
            "response": response,
            "tool_calls": get_last_tool_calls(),
            "movies": get_collected_ui_movies(),
        }
    except RateLimitError:
        return JSONResponse(status_code=429, content=_RATE_LIMIT_BODY)
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": str(exc)})
