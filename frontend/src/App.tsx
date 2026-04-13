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
      }>(`${AGENT_URL}/chat`, { message: trimmed, history });

      // 4. Add assistant response
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        toolCalls: data.tool_calls?.map((t) => t.name) ?? [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Show the error inline in the chat thread
      const errorText =
        axios.isAxiosError(err) && err.response?.data?.error
          ? (err.response.data.error as string)
          : "I couldn't reach the agent. Please check it's running and try again.";

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
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      <Sidebar onNewChat={handleNewChat} chatCount={messages.length} />
      <Chat messages={messages} isLoading={isLoading} onSend={sendMessage} />
    </div>
  );
}
