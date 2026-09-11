import type { Metadata } from "next";

import { MovieLedger, type MovieStatus, type MovieView } from "@/components/movies/movie-ledger";
import { getCurrentUser } from "@/lib/auth/session";
import { listMovieListsForUser, listMoviesForUser, type MovieRecord } from "@/lib/db/queries/movies";

export const metadata: Metadata = { title: "Movies & TV" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | Date | null) {
  if (!value) return "Not dated";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function presentMovie(movie: MovieRecord) {
  return {
    id: movie.id,
    title: movie.title,
    creator: movie.creator ?? (movie.mediaType === "tv" ? "Creator unavailable" : "Director unavailable"),
    mediaType: movie.mediaType,
    date: formatDate(movie.loggedDate ?? movie.createdAt),
    posterUrl: movie.posterUrl,
  };
}

export default async function MoviesPage({ searchParams }: PageProps<"/movies">) {
  const query = await searchParams;
  const requestedStatus = first(query.status);
  const requestedView = first(query.view);

  const status: MovieStatus = requestedStatus === "watchlist" || requestedStatus === "lists" ? requestedStatus : "watched";
  const view: MovieView = requestedView === "images" ? "images" : "list";
  const user = await getCurrentUser();
  if (!user) return null;

  const listRecords = status === "lists" ? await listMovieListsForUser(user.id) : [];
  const movieRecords = status === "lists" ? [] : await listMoviesForUser(user.id, status);
  const lists = listRecords.map((list) => ({
    id: list.id,
    title: list.name,
    date: formatDate(list.createdAt),
    movies: list.movies.map(presentMovie),
  }));

  return <MovieLedger status={status} view={view} movies={movieRecords.map(presentMovie)} lists={lists} showCreateList={status === "lists" && first(query.new) === "list"} />;
}
