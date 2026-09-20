import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!process.env.TMDB_API_READ_TOKEN && !process.env.TMDB_API_KEY) throw new Error("TMDB credentials are required.");

const baseUrl = process.env.MOVIE_FLOW_BASE_URL ?? "http://localhost:3000";
const requestOrigin = process.env.MOVIE_FLOW_ORIGIN ?? baseUrl;
const email = `movie-flow-${randomUUID()}@example.invalid`;
const password = `Movie-flow-${randomUUID()}`;
const sql = neon(process.env.DATABASE_URL);
let userId = null;

async function jsonRequest(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status}): ${data?.error ?? "Unknown error"}`);
  return { data, response };
}

try {
  const signup = await jsonRequest("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: requestOrigin },
    body: JSON.stringify({ email, name: "Movie Flow Test", password }),
  });
  userId = signup.data?.user?.id ?? null;
  if (!userId) throw new Error("Temporary user was not returned by Better Auth.");

  const setCookies = typeof signup.response.headers.getSetCookie === "function"
    ? signup.response.headers.getSetCookie()
    : [signup.response.headers.get("set-cookie")].filter(Boolean);
  const cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const headers = { "Content-Type": "application/json", Cookie: cookie, Origin: requestOrigin };

  const search = await jsonRequest("/api/movies/search?q=The%20Office", { headers });
  const results = search.data?.results ?? [];
  const movieResult = results.find((result) => result.mediaType === "movie");
  const tvResult = results.find((result) => result.mediaType === "tv");
  if (!movieResult?.tmdbId || !tvResult?.tmdbId) {
    throw new Error("Combined TMDB search did not return both movie and TV results.");
  }

  const preview = await jsonRequest(`/api/movies/preview?tmdbId=${tvResult.tmdbId}&mediaType=tv`, { headers });
  if (preview.data?.preview?.kind !== "tv" || !preview.data.preview.title) {
    throw new Error("TV preview did not return normalized show information.");
  }

  const created = await jsonRequest("/api/movies", {
    method: "POST",
    headers,
    body: JSON.stringify({ tmdbId: tvResult.tmdbId, mediaType: "tv", status: "watchlist" }),
  });
  const entryId = created.data?.movie?.id;
  if (!entryId || created.data.movie.mediaType !== "tv" || created.data.movie.status !== "watchlist") {
    throw new Error("TV entry was not persisted in Watchlist with its media type.");
  }

  const watchlistSearch = await jsonRequest("/api/movies/search?q=The%20Office", { headers });
  const savedWatchlistResult = watchlistSearch.data?.results?.find((result) => (
    result.tmdbId === tvResult.tmdbId && result.mediaType === "tv"
  ));
  if (savedWatchlistResult?.savedStatus !== "watchlist" || savedWatchlistResult.savedEntryId !== entryId) {
    throw new Error("Movie search did not report the saved Watchlist state.");
  }

  const duplicate = await jsonRequest("/api/movies", {
    method: "POST",
    headers,
    body: JSON.stringify({
      tmdbId: tvResult.tmdbId,
      mediaType: "tv",
      status: "watched",
      rating: 5,
      review: "**Verified** TV flow.",
      loggedDate: "2026-09-11",
    }),
  });
  if (duplicate.data.created !== false || duplicate.data.movie.id !== entryId || duplicate.data.movie.status !== "watched" || duplicate.data.movie.rating !== 5) {
    throw new Error("The search review flow did not promote the existing TV show to Watched.");
  }

  const watchedSearch = await jsonRequest("/api/movies/search?q=The%20Office", { headers });
  const savedWatchedResult = watchedSearch.data?.results?.find((result) => (
    result.tmdbId === tvResult.tmdbId && result.mediaType === "tv"
  ));
  if (savedWatchedResult?.savedStatus !== "watched" || savedWatchedResult.savedEntryId !== entryId) {
    throw new Error("Movie search did not report the promoted Watched state.");
  }

  const saved = await jsonRequest(`/api/movies/${entryId}`, { headers });
  if (saved.data.movie.mediaType !== "tv" || saved.data.movie.rating !== 5) {
    throw new Error("Saved TV details were not returned correctly.");
  }

  console.log(`Combined movie and TV flow verified (${movieResult.title} / ${tvResult.title}).`);
} finally {
  if (userId) await sql`delete from "user" where id = ${userId}`;
  else await sql`delete from "user" where email = ${email}`;
}
