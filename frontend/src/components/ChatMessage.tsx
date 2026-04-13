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
function parseBoldToPills(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    // Odd indices are the captured groups (the bold text)
    if (i % 2 === 1) {
      return (
        <span
          key={i}
          className="inline-flex items-center mx-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap"
        >
          {part}
        </span>
      );
    }
    // Even indices are plain text — preserve newlines
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
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
  const nodes = parseBoldToPills(content);

  return (
    <div className="flex gap-3 max-w-3xl">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold mt-0.5 shadow-sm">
        M
      </div>

      <div className="flex-1 space-y-3">
        {/* White card bubble */}
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-gray-900 text-sm leading-relaxed shadow-sm">
          {nodes}
        </div>

        {/* Movie cards row */}
        {movies && movies.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
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
    <div className="flex gap-3 max-w-3xl">
      {/* Error avatar */}
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

      {/* Red-tinted card */}
      <div className="flex-1">
        <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3 text-red-800 text-sm leading-relaxed shadow-sm">
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
