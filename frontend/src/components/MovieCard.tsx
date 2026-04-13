const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

export interface MovieData {
  id?: number;
  title: string;
  year?: string | number;
  rating?: number;
  poster_path?: string | null;
  overview?: string | null;
  genres?: string[];
}

const GENRE_PALETTES = [
  "bg-fuchsia-500/25 text-fuchsia-100 border-fuchsia-400/35",
  "bg-sky-500/25 text-sky-100 border-sky-400/35",
  "bg-amber-500/25 text-amber-100 border-amber-400/35",
  "bg-emerald-500/25 text-emerald-100 border-emerald-400/35",
  "bg-rose-500/25 text-rose-100 border-rose-400/35",
  "bg-violet-500/25 text-violet-100 border-violet-400/35",
  "bg-orange-500/25 text-orange-100 border-orange-400/35",
  "bg-cyan-500/25 text-cyan-100 border-cyan-400/35",
];

function genrePillClass(genre: string): string {
  let h = 0;
  for (let i = 0; i < genre.length; i += 1) h += genre.charCodeAt(i);
  return GENRE_PALETTES[h % GENRE_PALETTES.length];
}

function StarRow({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(10, rating));
  const filled = Math.round(clamped / 2);

  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${clamped.toFixed(1)} out of 10`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={
              i <= filled
                ? "w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]"
                : "w-3.5 h-3.5 text-white/20"
            }
          >
            <path
              fillRule="evenodd"
              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
              clipRule="evenodd"
            />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-white/90 tabular-nums">
        {clamped.toFixed(1)}
      </span>
      <span className="text-[0.65rem] text-white/40 font-medium">/10</span>
    </div>
  );
}

export default function MovieCard({
  title,
  year,
  rating,
  poster_path,
  overview,
  genres = [],
}: MovieData) {
  const posterUrl =
    poster_path && poster_path.length > 0
      ? `${TMDB_IMAGE_BASE}${poster_path.startsWith("/") ? poster_path : `/${poster_path}`}`
      : null;

  const blurb =
    overview && overview.trim().length > 0 ? overview.trim() : null;

  return (
    <article
      className="flex flex-col w-full max-w-[220px] flex-shrink-0 overflow-hidden rounded-2xl
        border border-white/[0.14] bg-white/[0.07] backdrop-blur-xl
        shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]
        transition-[transform,box-shadow,border-color] duration-300 ease-out
        hover:scale-[1.02] hover:border-purple-400/35
        hover:shadow-[0_16px_48px_rgba(0,0,0,0.45),0_12px_36px_rgba(88,28,135,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]"
    >
      <div className="relative aspect-[2/3] w-full bg-black/30">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${title} poster`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-12 h-12 text-white/20"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="flex flex-col gap-2 p-3 pt-2.5">
        <div>
          <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2">
            {title}
          </h3>
          {year != null && year !== "" && (
            <p className="mt-0.5 text-xs text-white/50">{year}</p>
          )}
        </div>

        {rating !== undefined && rating !== null && !Number.isNaN(Number(rating)) && (
          <StarRow rating={Number(rating)} />
        )}

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 4).map((g) => (
              <span
                key={g}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium ${genrePillClass(g)}`}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {blurb && (
          <p className="text-xs leading-relaxed text-white/65 line-clamp-4">{blurb}</p>
        )}
      </div>
    </article>
  );
}
