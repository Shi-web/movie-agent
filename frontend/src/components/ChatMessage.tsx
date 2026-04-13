import MovieCard from "./MovieCard";
import type { MovieData } from "./MovieCard";
import type { Message } from "../App";

export type { MovieData };

// ---------------------------------------------------------------------------
// Bold-markdown parser
// Splits content on **text** tokens and returns React nodes:
//   - plain strings → <span>
//   - bold tokens   → styled pill badge
// ---------------------------------------------------------------------------
function parseBoldToPills(
  text: string,
  pillClassName: string,
): React.ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span
          key={i}
          className={`inline-flex items-center mx-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${pillClassName}`}
        >
          {part}
        </span>
      );
    }
    return (
      <span key={i} className="whitespace-pre-wrap">
        {part}
      </span>
    );
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end chat-message-enter">
      <div
        className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-white
          bg-gradient-to-br from-purple-600 via-violet-600 to-purple-800
          shadow-[0_4px_24px_rgba(147,51,234,0.42),0_0_48px_rgba(109,40,217,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]
          ring-1 ring-purple-400/35"
      >
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({
  content,
  movies,
}: {
  content: string;
  movies?: MovieData[];
}) {
  const pillClass =
    "bg-purple-500/20 text-purple-100 border border-purple-400/35";
  const nodes = parseBoldToPills(content, pillClass);

  return (
    <div className="flex gap-3 max-w-3xl chat-message-enter">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold mt-0.5 shadow-[0_0_16px_rgba(147,51,234,0.4)] ring-1 ring-purple-400/40">
        M
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed
            border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl text-gray-100
            shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          {nodes}
        </div>

        {movies && movies.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {movies.map((movie, i) => (
              <MovieCard key={movie.id ?? i} {...movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3 max-w-3xl chat-message-enter">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white mt-0.5 shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="flex-1">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed border border-red-400/25 bg-red-500/10 backdrop-blur-md text-red-100">
          {content}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return <UserBubble content={message.content} />;
  }

  if (message.isError) {
    return <ErrorBubble content={message.content} />;
  }

  return (
    <AssistantBubble content={message.content} movies={message.movies} />
  );
}
