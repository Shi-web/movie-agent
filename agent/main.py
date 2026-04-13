from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from .agent import get_last_tool_calls, run_agent
except ImportError:
    from agent import get_last_tool_calls, run_agent

load_dotenv()

app = FastAPI(title="Movie Agent API", version="0.1.0")
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
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": str(exc)})
