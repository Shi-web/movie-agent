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
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent">
      {/* ------------------------------------------------------------------ */}
      {/* Message list                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {isEmpty && <WelcomeScreen onMoodSelect={handleChipClick} />}

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
        onQuickPrompt={(text) => {
          if (isLoading) return;
          onSend(text);
          setInput("");
        }}
        disabled={isLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen (no messages yet)
// ---------------------------------------------------------------------------

const WELCOME_MOOD_CARDS: {
  label: string;
  emoji: string;
  prompt: string;
  cardClass: string;
}[] = [
  {
    label: "Feel-good",
    emoji: "🌈",
    prompt:
      "I want an uplifting, feel-good movie that leaves me smiling — comedy, heartwarming drama, or something colorful and hopeful.",
    cardClass:
      "bg-gradient-to-br from-amber-500/35 via-orange-500/25 to-rose-500/30 border-amber-400/25 hover:border-amber-300/50 hover:shadow-[0_12px_40px_rgba(251,191,36,0.2)]",
  },
  {
    label: "Edge of my seat",
    emoji: "🔥",
    prompt:
      "Recommend intense thrillers or action movies that will keep me on the edge of my seat with high stakes and tension.",
    cardClass:
      "bg-gradient-to-br from-red-600/35 via-orange-600/25 to-amber-500/25 border-red-400/25 hover:border-orange-400/45 hover:shadow-[0_12px_40px_rgba(239,68,68,0.22)]",
  },
  {
    label: "Date night",
    emoji: "💕",
    prompt:
      "Suggest romantic movies perfect for date night — great chemistry, memorable scenes, not too heavy unless it earns it.",
    cardClass:
      "bg-gradient-to-br from-pink-500/35 via-rose-500/30 to-fuchsia-500/25 border-pink-400/30 hover:border-pink-300/55 hover:shadow-[0_12px_40px_rgba(236,72,153,0.22)]",
  },
  {
    label: "Mindblown",
    emoji: "🤯",
    prompt:
      "I love mind-bending movies with twists, puzzles, or reality-bending plots — sci-fi, psychological thrillers, or clever mysteries.",
    cardClass:
      "bg-gradient-to-br from-violet-600/35 via-purple-600/30 to-cyan-500/25 border-violet-400/25 hover:border-cyan-400/40 hover:shadow-[0_12px_40px_rgba(139,92,246,0.25)]",
  },
  {
    label: "Big laughs",
    emoji: "😂",
    prompt:
      "I need a genuinely funny comedy — sharp writing, great performances, something that will make me laugh out loud.",
    cardClass:
      "bg-gradient-to-br from-yellow-500/30 via-lime-500/25 to-emerald-500/25 border-yellow-400/25 hover:border-lime-400/45 hover:shadow-[0_12px_40px_rgba(234,179,8,0.18)]",
  },
  {
    label: "Epic night",
    emoji: "🎬",
    prompt:
      "Show me epic, cinematic films — big visuals, memorable scores, the kind of movie that feels like an event.",
    cardClass:
      "bg-gradient-to-br from-indigo-600/35 via-blue-600/28 to-sky-500/25 border-indigo-400/25 hover:border-sky-400/45 hover:shadow-[0_12px_40px_rgba(99,102,241,0.22)]",
  },
];

function CinemaWelcomeIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 440 300"
      className="w-full max-w-md h-auto drop-shadow-[0_20px_50px_rgba(88,28,135,0.35)]"
      aria-hidden
    >
      <defs>
        <linearGradient id="wc-curtain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="50%" stopColor="#6b21a8" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="wc-screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="wc-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#a855f7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wc-reel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <filter id="wc-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Curtains */}
      <path
        fill="url(#wc-curtain)"
        d="M8 24c72-8 144-8 216 0 72 8 144 8 208 24v252H8V24z"
        opacity="0.92"
      />
      <path
        fill="#2e1065"
        d="M8 24 L80 8 L220 4 L360 8 L432 24v8L220 20 8 32z"
        opacity="0.85"
      />

      {/* Screen frame */}
      <rect
        x="72"
        y="56"
        width="296"
        height="178"
        rx="10"
        fill="#020617"
        stroke="url(#wc-screen)"
        strokeWidth="3"
      />
      <rect x="78" y="62" width="284" height="166" rx="6" fill="#020617" />
      <ellipse cx="220" cy="145" rx="120" ry="72" fill="url(#wc-glow)" />

      {/* Film strip sides */}
      <g opacity="0.9">
        <rect x="24" y="88" width="36" height="140" rx="4" fill="url(#wc-reel)" stroke="#475569" strokeWidth="1" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x="30"
            y={98 + i * 26}
            width="24"
            height="16"
            rx="2"
            fill="#0f172a"
            stroke="#64748b"
            strokeWidth="0.75"
          />
        ))}
        <rect x="380" y="88" width="36" height="140" rx="4" fill="url(#wc-reel)" stroke="#475569" strokeWidth="1" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={`r-${i}`}
            x="386"
            y={98 + i * 26}
            width="24"
            height="16"
            rx="2"
            fill="#0f172a"
            stroke="#64748b"
            strokeWidth="0.75"
          />
        ))}
      </g>

      {/* Reels */}
      <g transform="translate(48, 200)">
        <circle r="36" fill="#0f172a" stroke="#7c3aed" strokeWidth="2" opacity="0.95" />
        <circle r="12" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="0"
            x2={Math.cos((deg * Math.PI) / 180) * 28}
            y2={Math.sin((deg * Math.PI) / 180) * 28}
            stroke="#6d28d9"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        ))}
      </g>
      <g transform="translate(392, 200)">
        <circle r="36" fill="#0f172a" stroke="#db2777" strokeWidth="2" opacity="0.95" />
        <circle r="12" fill="#1e1b4b" stroke="#f472b6" strokeWidth="1.5" />
        {[30, 90, 150, 210, 270, 330].map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="0"
            x2={Math.cos((deg * Math.PI) / 180) * 28}
            y2={Math.sin((deg * Math.PI) / 180) * 28}
            stroke="#be185d"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.65"
          />
        ))}
      </g>

      {/* Clapperboard */}
      <g transform="translate(188, 228)">
        <rect x="0" y="18" width="64" height="44" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.2" />
        <path
          d="M4 18 L60 6 L64 14 L8 26 Z"
          fill="#1e293b"
          stroke="#fbbf24"
          strokeWidth="1"
        />
        <path d="M8 10 L14 22 M18 8 L24 20 M28 6 L34 18 M38 8 L44 20 M48 6 L54 18" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        <rect x="8" y="28" width="48" height="28" rx="2" fill="#020617" opacity="0.85" />
      </g>

      {/* Spotlight beams */}
      <path
        d="M220 20 L140 62 L300 62 Z"
        fill="#a855f7"
        opacity="0.12"
        filter="url(#wc-soft)"
      />
      <path
        d="M220 20 L160 58 L280 58 Z"
        fill="#f472b6"
        opacity="0.1"
        filter="url(#wc-soft)"
      />

      {/* Stars */}
      {[
        [100, 48, 1.2],
        [340, 40, 0.9],
        [260, 72, 0.7],
        [180, 78, 0.8],
      ].map(([cx, cy, s], i) => (
        <path
          key={i}
          d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z"
          fill="#fde68a"
          opacity="0.85"
          transform={`translate(${cx} ${cy}) scale(${s})`}
        />
      ))}
    </svg>
  );
}

function WelcomeScreen({ onMoodSelect }: { onMoodSelect: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-8 px-4 pb-20">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        <div className="mb-2 w-full flex justify-center">
          <CinemaWelcomeIllustration />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/70 mb-3">
          MovieAgent
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance leading-tight mb-3 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
          What are you in the mood to watch?
        </h1>

        <p className="text-sm sm:text-base text-gray-400 max-w-md leading-relaxed mb-10">
          Pick a vibe below or type anything — I search TMDB and bring back picks
          with posters, ratings, and similar titles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
          {WELCOME_MOOD_CARDS.map(({ label, emoji, prompt, cardClass }) => (
            <button
              key={label}
              type="button"
              onClick={() => onMoodSelect(prompt)}
              className={[
                "group relative overflow-hidden rounded-2xl border px-4 py-4 text-left",
                "backdrop-blur-md transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.99]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                cardClass,
              ].join(" ")}
            >
              <span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <span
                  className="text-3xl leading-none flex-shrink-0 drop-shadow-md"
                  aria-hidden
                >
                  {emoji}
                </span>
                <div className="min-w-0">
                  <span className="block text-base font-semibold text-white tracking-tight">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/65 leading-snug">
                    Tap to get recommendations
                  </span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-white/40 group-hover:text-white/90 ml-auto flex-shrink-0 transition-colors"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
