import { useEffect, useRef, useState } from "react";
import type { Message } from "../App";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ToolCallIndicator from "./ToolCallIndicator";

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
}

// Clicking a chip sends immediately — no need to go through the textarea
const EXAMPLE_PROMPTS = [
  "Find me something like Interstellar but funnier",
  "What are the best thriller movies from the 90s?",
  "I want a feel-good movie for a rainy evening",
];

export default function Chat({ messages, isLoading, onSend }: ChatProps) {
  // input is purely local UI state; App owns all real data
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput("");
  }

  function handleChipClick(prompt: string) {
    if (isLoading) return;
    onSend(prompt);
  }

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
      {/* ------------------------------------------------------------------ */}
      {/* Message list                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {isEmpty && (
          <EmptyState onChipClick={handleChipClick} />
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && <ToolCallIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Input bar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome / empty state
// ---------------------------------------------------------------------------

function FilmIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-8 h-8 text-purple-400"
    >
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
      <path
        fillRule="evenodd"
        d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5"
    >
      <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.897l-2.051-.684a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.633.633l-.551.183a1 1 0 000 1.898l.551.184a1 1 0 01.633.632l.184.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.632l.551-.184a1 1 0 000-1.898l-.551-.183a1 1 0 01-.633-.633l-.184-.551z" />
    </svg>
  );
}

function EmptyState({ onChipClick }: { onChipClick: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pb-24 px-4">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
        <FilmIcon />
      </div>

      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          What are you in the mood for?
        </h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          Ask me anything about movies — I can search TMDB, recommend films,
          and find similar titles.
        </p>
      </div>

      {/* Prompt chips */}
      <div className="flex flex-col gap-2.5 w-full max-w-md">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onChipClick(prompt)}
            className="flex items-start gap-2.5 w-full px-4 py-3 rounded-xl text-sm text-gray-300 bg-gray-800/60 border border-gray-700 hover:bg-gray-800 hover:border-purple-600/50 hover:text-white text-left transition-all duration-150 group"
          >
            <SparkleIcon />
            <span className="leading-snug">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
