import { useEffect, useRef } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Fills and sends a quick prompt (mood chips) */
  onQuickPrompt: (text: string) => void;
  disabled: boolean;
}

const LINE_HEIGHT = 24;
const MAX_LINES = 5;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;

const MOOD_CHIPS: { label: string; prompt: string }[] = [
  { label: "😂 Something funny", prompt: "Suggest something funny and lighthearted to watch tonight" },
  { label: "😱 Scare me", prompt: "Recommend horror or thriller movies that will really scare me" },
  { label: "💕 Romance", prompt: "Romance movies with great chemistry and heart" },
  { label: "🧠 Mind-bending", prompt: "Mind-bending movies with twists and puzzles" },
];

export default function ChatInput({
  value,
  onChange,
  onSend,
  onQuickPrompt,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="px-4 pb-6 pt-2 bg-transparent">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {MOOD_CHIPS.map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => onQuickPrompt(prompt)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-200
                bg-white/[0.07] border border-white/[0.12] backdrop-blur-sm
                hover:bg-purple-500/20 hover:border-purple-400/40 hover:text-white
                active:scale-[0.98] transition-all duration-150
                disabled:opacity-40 disabled:pointer-events-none shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="chat-input-shell rounded-2xl p-[1.5px]">
          <div
            className={[
              "flex items-end gap-3 rounded-[14px] px-4 py-3",
              "bg-slate-950/75 backdrop-blur-xl border border-white/[0.06]",
              disabled ? "opacity-75" : "",
            ].join(" ")}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a movie…"
              disabled={disabled}
              style={{ maxHeight: `${MAX_HEIGHT}px` }}
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-500 resize-none outline-none disabled:cursor-not-allowed leading-6"
            />

            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send message"
              className={[
                "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-purple-600 to-fuchsia-600",
                "hover:from-purple-500 hover:to-fuchsia-500 active:from-purple-700 active:to-fuchsia-700",
                "ring-1 ring-fuchsia-400/40 transition-colors duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:animate-none",
                canSend ? "chat-send-btn-pulse" : "",
              ].join(" ")}
            >
              {disabled ? (
                <svg
                  className="w-4 h-4 text-white animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
