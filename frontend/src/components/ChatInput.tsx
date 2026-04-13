import { useEffect, useRef } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const LINE_HEIGHT = 24; // px — matches text-sm + leading
const MAX_LINES = 5;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES; // 120px

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize up to MAX_LINES
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
    <div className="px-4 pb-6 pt-2 bg-gray-950">
      <div className="max-w-3xl mx-auto">
        <div
          className={[
            "flex items-end gap-3 bg-white border rounded-2xl px-4 py-3 transition-colors duration-150",
            disabled
              ? "border-gray-200 opacity-75"
              : "border-gray-300 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/30",
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
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none outline-none disabled:cursor-not-allowed leading-6"
          />

          <button
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {disabled ? (
              /* Spinner while loading */
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
              /* Send arrow */
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

        <p className="text-center text-xs text-gray-600 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
