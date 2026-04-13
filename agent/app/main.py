from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from agent import get_last_tool_calls, run_agent
from tools import get_collected_ui_movies

app = FastAPI(title="Movie Agent API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    history: list = []


class ToolCall(BaseModel):
    name: str


class UiMovie(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    title: str
    year: str | int | None = None
    rating: float | None = None
    poster_path: str | None = None
    overview: str | None = None
    genres: list[str] = []


class ChatResponse(BaseModel):
    response: str
    tool_calls: list[ToolCall]
    movies: list[UiMovie] = []


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "movie-agent", "docs": "/docs"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    try:
        response = run_agent(req.message, req.history)
        tool_calls = [ToolCall(name=name) for name in get_last_tool_calls()]
        raw_movies = get_collected_ui_movies()
        movies = [UiMovie.model_validate(m) for m in raw_movies]
        return ChatResponse(response=response, tool_calls=tool_calls, movies=movies)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail={"error": str(exc)}) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"error": f"Unexpected error: {exc}"}) from exc
