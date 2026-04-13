function SprocketRow() {
  return (
    <div
      className="flex justify-between items-center gap-0.5 px-2 py-1 bg-black/55 border-y border-white/[0.06]"
      aria-hidden
    >
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="h-1.5 w-2 rounded-[1px] bg-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        />
      ))}
    </div>
  );
}

export default function ToolCallIndicator() {
  return (
    <div className="flex gap-3 max-w-3xl chat-message-enter">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold mt-0.5 shadow-[0_0_16px_rgba(147,51,234,0.4)] ring-1 ring-purple-400/40">
        M
      </div>

      <div className="flex flex-col gap-2 pt-0.5">
        <div
          className="inline-flex flex-col overflow-hidden rounded-lg border border-slate-600/40 bg-slate-950/90 backdrop-blur-md shadow-[0_8px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]"
          role="status"
          aria-live="polite"
          aria-label="Assistant is searching"
        >
          <SprocketRow />
          <div className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-b from-slate-900/95 to-slate-950/98">
            <span className="typing-dot-bounce h-2 w-2 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-400 shadow-[0_0_10px_rgba(192,132,252,0.7)]" />
            <span className="typing-dot-bounce h-2 w-2 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-400 shadow-[0_0_10px_rgba(192,132,252,0.7)]" />
            <span className="typing-dot-bounce h-2 w-2 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-400 shadow-[0_0_10px_rgba(192,132,252,0.7)]" />
          </div>
          <SprocketRow />
        </div>
        <p className="text-xs text-gray-500 pl-0.5">Searching TMDB…</p>
      </div>
    </div>
  );
}
