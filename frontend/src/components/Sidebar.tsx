interface SidebarProps {
  onNewChat: () => void;
  chatCount: number;
}

export default function Sidebar({ onNewChat, chatCount }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">
      {/* Logo / title */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-800">
        <span className="text-indigo-400">
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

      {/* New chat button */}
      <div className="px-3 pt-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-colors duration-150 border border-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-indigo-400"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </div>

      {/* Chat history placeholder */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 space-y-1">
        {chatCount > 0 && (
          <p className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Recent
          </p>
        )}
        {chatCount > 0 && (
          <div className="px-2 py-1.5 rounded-md text-sm text-gray-400 bg-gray-800 truncate">
            Current conversation
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600">Powered by Groq + TMDB</p>
      </div>
    </aside>
  );
}
