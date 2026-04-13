import { useState } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import type { MovieData } from "./components/MovieCard";

export type { MovieData };

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: string[];
  movies?: MovieData[];
  isError?: boolean;
}

const AGENT_URL =
  (import.meta.env.VITE_AGENT_URL as string | undefined) ??
  "http://localhost:8000";

const RATE_LIMIT_CHAT_MESSAGE =
  "I'm getting too many requests right now — wait about 30 seconds and try again.";

function responseHasRateLimitError(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const rec = data as Record<string, unknown>;
  if (rec.error === "rate_limit") return true;
  const detail = rec.detail;
  if (detail && typeof detail === "object" && (detail as Record<string, unknown>).error === "rate_limit") {
    return true;
  }
  return false;
}

function apiErrorMessage(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const data = err.response?.data;
  if (!data || typeof data !== "object") return undefined;
  const rec = data as Record<string, unknown>;
  if (typeof rec.error === "string") return rec.error;
  const detail = rec.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && typeof (detail as { error?: unknown }).error === "string") {
    return (detail as { error: string }).error;
  }
  return undefined;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // history is the snapshot of messages at call-time (before the new user msg)
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Capture history before mutating state
    const history = messages.map(({ role, content }) => ({ role, content }));

    // 1. Add user message to UI immediately
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Show ToolCallIndicator
    setIsLoading(true);

    try {
      // 3. POST to agent
      const { data } = await axios.post<{
        response: string;
        tool_calls: { name: string }[];
        movies?: MovieData[];
      }>(`${AGENT_URL}/chat`, { message: trimmed, history });

      // 4. Add assistant response
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        toolCalls: data.tool_calls?.map((t) => t.name) ?? [],
        movies: data.movies?.length ? data.movies : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Show the error inline in the chat thread
      const data = axios.isAxiosError(err) ? err.response?.data : undefined;
      const rateLimited =
        (axios.isAxiosError(err) && err.response?.status === 429) ||
        (data !== undefined && responseHasRateLimitError(data));
      const errorText = rateLimited
        ? RATE_LIMIT_CHAT_MESSAGE
        : (apiErrorMessage(err) ??
          "I couldn't reach the agent. Please check it's running and try again.");

      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: errorText,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      // 5. Hide ToolCallIndicator
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    if (isLoading) return; // don't wipe mid-request
    setMessages([]);
  }

  return (
    <div className="relative flex h-screen overflow-hidden text-gray-100">
      <div
        className="cinema-bg-fixed cinema-gradient-animated"
        aria-hidden
      />
      <div className="cinema-bg-fixed cinema-bokeh" aria-hidden />
      <div className="cinema-bg-fixed cinema-bokeh-slow" aria-hidden />
      <div className="cinema-bg-fixed cinema-grain-animated" aria-hidden />
      <div className="relative z-10 flex flex-1 min-w-0 min-h-0">
        <Sidebar
          onNewChat={handleNewChat}
          chatCount={messages.length}
          isLoading={isLoading}
          onGenrePrompt={sendMessage}
        />
        <Chat messages={messages} isLoading={isLoading} onSend={sendMessage} />
      </div>
    </div>
  );
}
