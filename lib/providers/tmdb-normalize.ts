const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";

export type TmdbMediaType = "movie" | "tv";

export type TmdbSearchResult = {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
};

export type TmdbCredits = {
  cast: { name: string; order: number }[];
  crew: { job: string; name: string }[];
};

export type TmdbMovieDetails = TmdbSearchResult & {
  runtime: number | null;
  credits: TmdbCredits;
};

export type TmdbTvDetails = TmdbSearchResult & {
  created_by?: { name: string }[];
  episode_run_time?: number[];
  credits: TmdbCredits;
};

export type TmdbSearchTitle = {
  tmdbId: number;
  mediaType: TmdbMediaType;
  title: string;
  year: string;
  overview: string;
  posterUrl: string | null;
};

export type TmdbTitle = TmdbSearchTitle & {
  creator: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  cast: string[];
};

function imageUrl(path: string | null, size: "w185" | "w500" | "original") {
  return path ? `${TMDB_IMAGE_URL}/${size}${path}` : null;
}

function titleFor(result: TmdbSearchResult) {
  return result.title || result.original_title || result.name || result.original_name || "Untitled";
}

function dateFor(result: TmdbSearchResult) {
  return result.release_date || result.first_air_date || null;
}

export function normalizeTmdbSearchResults(results: TmdbSearchResult[]): TmdbSearchTitle[] {
  return results
    .filter((result): result is TmdbSearchResult & { media_type: TmdbMediaType } => result.media_type === "movie" || result.media_type === "tv")
    .slice(0, 8)
    .map((result) => ({
      tmdbId: result.id,
      mediaType: result.media_type,
      title: titleFor(result),
      year: dateFor(result)?.slice(0, 4) || "Unknown",
      overview: result.overview,
      posterUrl: imageUrl(result.poster_path, "w185"),
    }));
}

export function normalizeTmdbTitleDetails(
  title: TmdbMovieDetails | TmdbTvDetails,
  mediaType: TmdbMediaType,
): TmdbTitle {
  const creator = mediaType === "movie"
    ? title.credits.crew.find((person) => person.job === "Director")?.name ?? null
    : (title as TmdbTvDetails).created_by?.map((person) => person.name).join(", ") || null;
  const runtimeMinutes = mediaType === "movie"
    ? (title as TmdbMovieDetails).runtime
    : (title as TmdbTvDetails).episode_run_time?.find((runtime) => runtime > 0) ?? null;

  return {
    tmdbId: title.id,
    mediaType,
    title: titleFor(title),
    year: dateFor(title)?.slice(0, 4) || "Unknown",
    overview: title.overview,
    posterUrl: imageUrl(title.poster_path, "w500"),
    backdropUrl: imageUrl(title.backdrop_path, "original"),
    releaseDate: dateFor(title),
    runtimeMinutes,
    creator,
    cast: title.credits.cast.sort((a, b) => a.order - b.order).slice(0, 12).map((person) => person.name),
  };
}
