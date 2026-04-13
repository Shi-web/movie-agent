interface SidebarProps {
  onNewChat: () => void;
  chatCount: number;
  isLoading?: boolean;
  onGenrePrompt: (genre: string) => void;
}

const GENRES = [
  "Comedy",
  "Thriller",
  "Romance",
  "Action",
  "Sci-Fi",
  "Horror",
  "Drama",
  "Animation",
] as const;

function ClapperboardArt() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 100"
      fill="none"
      className="w-full max-w-[7.5rem] mx-auto text-violet-400/25"
      aria-hidden
    >
      {/* Board */}
      <path
        d="M12 38h96v52H12V38z"
        stroke="currentColor"
        strokeWidth="1.25"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* Hinge / top bar */}
      <path
        d="M12 38V28l96-8v18H12z"
        stroke="currentColor"
        strokeWidth="1.25"
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Stripes on clapper top */}
      <path
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        d="M22 32l6-8m12 6l6-8m12 6l6-8m12 6l6-8m12 6l6-8"
      />
      {/* Reel circles (subtle) */}
      <circle cx="32" cy="64" r="10" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" />
      <circle cx="88" cy="64" r="10" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" />
      <circle cx="60" cy="72" r="6" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.25" />
    </svg>
  );
}

export default function Sidebar({
  onNewChat,
  chatCount,
  isLoading = false,
  onGenrePrompt,
}: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col min-h-0 bg-gradient-to-b from-[#1e1b3a] to-[#12101f] border-r border-white/[0.1] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
      {/* Logo / title */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.08]">
        <span className="text-violet-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
            <path
              fillRule="evenodd"
              d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="text-white font-semibold text-lg tracking-tight">
          MovieAgent
        </span>
      </div>

      {/* New chat — glowing purple */}
      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-[length:200%_100%]
            shadow-[0_0_22px_rgba(168,85,247,0.45),0_0_42px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]
            ring-1 ring-purple-400/50 hover:ring-purple-300/60
            hover:shadow-[0_0_28px_rgba(192,132,252,0.55),0_0_52px_rgba(139,92,246,0.28)]
            hover:from-purple-500 hover:via-violet-500 hover:to-purple-500
            active:scale-[0.98] transition-all duration-200
            disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
        >
          <span className="text-base leading-none" aria-hidden>
            ✨
          </span>
          <span>New chat</span>
          <span className="text-base leading-none" aria-hidden>
            🍿
          </span>
        </button>
      </div>

      {/* Chat history */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 space-y-1">
        {chatCount > 0 && (
          <p className="px-2 text-xs font-medium text-violet-300/50 uppercase tracking-wider mb-2">
            Recent
          </p>
        )}
        {chatCount > 0 && (
          <div className="px-2 py-1.5 rounded-lg text-sm text-gray-300 bg-white/[0.06] border border-white/[0.06] truncate">
            Current conversation
          </div>
        )}
      </nav>

      {/* Genre quick filters */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <p className="px-2 text-xs font-medium text-violet-300/50 uppercase tracking-wider mb-2.5">
          Browse by genre
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              disabled={isLoading}
              onClick={() =>
                onGenrePrompt(
                  `What are some standout ${genre} movies you'd recommend?`,
                )
              }
              className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-200
                bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm
                hover:bg-purple-500/20 hover:border-purple-400/35 hover:text-white
                active:scale-[0.97] transition-all duration-150
                disabled:opacity-40 disabled:pointer-events-none"
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Footer + illustration */}
      <div className="px-4 pt-2 pb-4 border-t border-white/[0.06] flex flex-col items-center gap-3">
        <ClapperboardArt />
        <p className="text-[0.65rem] text-center text-gray-500 leading-relaxed">
          Powered by Groq + TMDB
        </p>
      </div>
    </aside>
  );
}
