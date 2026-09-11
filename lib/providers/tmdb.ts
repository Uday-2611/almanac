import "server-only";

import {
  normalizeTmdbSearchResults,
  normalizeTmdbTitleDetails,
  type TmdbMediaType,
  type TmdbMovieDetails,
  type TmdbSearchResult,
  type TmdbSearchTitle,
  type TmdbTitle,
  type TmdbTvDetails,
} from "@/lib/providers/tmdb-normalize";

export type { TmdbMediaType, TmdbSearchTitle, TmdbTitle } from "@/lib/providers/tmdb-normalize";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const DETAIL_TIMEOUT_MS = 3_500;
const SEARCH_TIMEOUT_MS = 2_500;

export class TmdbConfigurationError extends Error {}

function transientNetworkCode(error: unknown) {
  if (!(error instanceof Error) || !("cause" in error)) return null;
  const cause = error.cause;
  if (typeof cause !== "object" || cause === null || !("code" in cause)) return null;
  return typeof cause.code === "string" ? cause.code : null;
}

function retryDelay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function tmdbFetch<T>(path: string, params: Record<string, string>, timeoutMs = DETAIL_TIMEOUT_MS) {
  const readToken = process.env.TMDB_API_READ_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!readToken && !apiKey) {
    throw new TmdbConfigurationError("TMDB is not configured yet.");
  }

  const url = new URL(`${TMDB_API_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (!readToken && apiKey) url.searchParams.set("api_key", apiKey);

  let response: Response | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: readToken ? { Authorization: `Bearer ${readToken}`, Accept: "application/json" } : { Accept: "application/json" },
        next: { revalidate: 60 * 60 },
        signal: AbortSignal.timeout(timeoutMs),
      });
      break;
    } catch (error) {
      lastError = error;
      const code = transientNetworkCode(error);
      const canRetry = attempt < 2 && (code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ECONNRESET");
      if (!canRetry) throw error;
      await retryDelay(80 * (attempt + 1));
    }
  }

  if (!response) throw lastError;

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function searchTmdbTitles(query: string): Promise<TmdbSearchTitle[]> {
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>("/search/multi", {
    query,
    include_adult: "false",
    language: "en-US",
    page: "1",
  }, SEARCH_TIMEOUT_MS);

  return normalizeTmdbSearchResults(data.results);
}

export async function getTmdbTitle(tmdbId: number, mediaType: TmdbMediaType): Promise<TmdbTitle> {
  const title = mediaType === "movie"
    ? await tmdbFetch<TmdbMovieDetails>(`/movie/${tmdbId}`, {
        append_to_response: "credits",
        language: "en-US",
      })
    : await tmdbFetch<TmdbTvDetails>(`/tv/${tmdbId}`, {
        append_to_response: "credits",
        language: "en-US",
      });
  return normalizeTmdbTitleDetails(title, mediaType);
}
