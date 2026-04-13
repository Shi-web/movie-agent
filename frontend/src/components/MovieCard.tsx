const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w200";

export interface MovieData {
  id?: number;
  title: string;
  year?: string | number;
  rating?: number;
  poster_path?: string;
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-3 h-3 text-amber-400"
    >
      <path
        fillRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function MovieCard({ title, year, rating, poster_path }: MovieData) {
  const posterUrl = poster_path ? `${TMDB_IMAGE_BASE}${poster_path}` : null;

  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm w-48 flex-shrink-0">
      {/* Poster */}
      <div className="w-16 flex-shrink-0">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${title} poster`}
            className="w-full h-full object-cover"
            style={{ minHeight: "96px" }}
          />
        ) : (
          <div
            className="w-full bg-gray-200 flex items-center justify-center"
            style={{ minHeight: "96px" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center py-2 pr-2 gap-1 min-w-0">
        <p className="text-gray-900 text-xs font-semibold leading-snug line-clamp-2">
          {title}
        </p>
        {year && (
          <p className="text-gray-500 text-xs">{year}</p>
        )}
        {rating !== undefined && (
          <div className="flex items-center gap-0.5">
            <StarIcon />
            <span className="text-gray-700 text-xs font-medium">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
