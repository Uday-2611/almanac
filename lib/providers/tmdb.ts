import "server-only";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";

type TmdbMovieResult = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
};

type TmdbCredits = {
  cast: { name: string; order: number }[];
  crew: { job: string; name: string }[];
};

type TmdbMovieDetails = TmdbMovieResult & {
  runtime: number | null;
  credits: TmdbCredits;
};

export type TmdbSearchMovie = {
  tmdbId: number;
  title: string;
  year: string;
  overview: string;
  posterUrl: string | null;
};

export type TmdbMovie = TmdbSearchMovie & {
  director: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  cast: string[];
};

export class TmdbConfigurationError extends Error {}

function imageUrl(path: string | null, size: "w185" | "w500" | "original") {
  return path ? `${TMDB_IMAGE_URL}/${size}${path}` : null;
}

async function tmdbFetch<T>(path: string, params: Record<string, string>) {
  const readToken = process.env.TMDB_API_READ_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!readToken && !apiKey) {
    throw new TmdbConfigurationError("TMDB is not configured yet.");
  }

  const url = new URL(`${TMDB_API_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (!readToken && apiKey) url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    headers: readToken ? { Authorization: `Bearer ${readToken}`, Accept: "application/json" } : { Accept: "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function searchTmdbMovies(query: string): Promise<TmdbSearchMovie[]> {
  const data = await tmdbFetch<{ results: TmdbMovieResult[] }>("/search/movie", {
    query,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });

  return data.results.slice(0, 8).map((movie) => ({
    tmdbId: movie.id,
    title: movie.title || movie.original_title,
    year: movie.release_date?.slice(0, 4) || "Unknown",
    overview: movie.overview,
    posterUrl: imageUrl(movie.poster_path, "w185"),
  }));
}

export async function getTmdbMovie(tmdbId: number): Promise<TmdbMovie> {
  const movie = await tmdbFetch<TmdbMovieDetails>(`/movie/${tmdbId}`, {
    append_to_response: "credits",
    language: "en-US",
  });
  const director = movie.credits.crew.find((person) => person.job === "Director")?.name ?? null;

  return {
    tmdbId: movie.id,
    title: movie.title || movie.original_title,
    year: movie.release_date?.slice(0, 4) || "Unknown",
    overview: movie.overview,
    posterUrl: imageUrl(movie.poster_path, "w500"),
    backdropUrl: imageUrl(movie.backdrop_path, "original"),
    releaseDate: movie.release_date || null,
    runtimeMinutes: movie.runtime,
    director,
    cast: movie.credits.cast.sort((a, b) => a.order - b.order).slice(0, 12).map((person) => person.name),
  };
}
