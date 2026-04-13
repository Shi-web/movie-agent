export default function ToolCallIndicator() {
  return (
    <div className="flex gap-3 max-w-3xl">
      {/* Avatar — matches assistant avatar in ChatMessage */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold mt-0.5">
        M
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
          {/* Pulsing dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
          </span>
          Searching TMDB…
        </span>

        {/* Skeleton text lines */}
        <div className="space-y-1.5 pt-0.5">
          <div className="h-3 w-48 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
