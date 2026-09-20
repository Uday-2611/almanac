import type { Metadata } from "next";

import { MovieLedger, type MovieStatus, type MovieView } from "@/components/movies/movie-ledger";
import { getCurrentUser } from "@/lib/auth/session";
import { listMovieListsForUser, listMoviesForUser, type MovieRecord } from "@/lib/db/queries/movies";
import { listMovieTagOptionsForUser, listTagsForMoviesForUser, type TagRecord } from "@/lib/db/queries/tags";
import { idSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Movies & TV" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | Date | null) {
  if (!value) return "Not dated";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function presentMovie(movie: MovieRecord, tags: TagRecord[] = []) {
  return {
    id: movie.id,
    title: movie.title,
    creator: movie.creator ?? (movie.mediaType === "tv" ? "Creator unavailable" : "Director unavailable"),
    mediaType: movie.mediaType,
    date: formatDate(movie.loggedDate ?? movie.createdAt),
    posterUrl: movie.posterUrl,
    tags: tags.map((tag) => tag.name),
  };
}

export default async function MoviesPage({ searchParams }: PageProps<"/movies">) {
  const query = await searchParams;
  const requestedStatus = first(query.status);
  const requestedView = first(query.view);
  const requestedTag = first(query.tag);

  const status: MovieStatus = requestedStatus === "watchlist" || requestedStatus === "lists" ? requestedStatus : "watched";
  const view: MovieView = requestedView === "images" ? "images" : "list";
  const user = await getCurrentUser();
  if (!user) return null;

  const databaseStatus = status === "watchlist" ? "watchlist" : "watched";
  const requestedTagId = idSchema.safeParse(requestedTag).success ? requestedTag : undefined;
  const [tagOptions, listRecords, requestedMovieRecords] = await Promise.all([
    status === "lists" ? Promise.resolve([]) : listMovieTagOptionsForUser(user.id, databaseStatus),
    status === "lists" ? listMovieListsForUser(user.id) : Promise.resolve([]),
    status === "lists" ? Promise.resolve([]) : listMoviesForUser(user.id, databaseStatus, requestedTagId),
  ]);
  const activeTagId = requestedTagId && tagOptions.some((tag) => tag.id === requestedTagId) ? requestedTagId : undefined;
  const movieRecords = status !== "lists" && requestedTagId && !activeTagId
    ? await listMoviesForUser(user.id, databaseStatus)
    : requestedMovieRecords;
  const movieIds = status === "lists" ? listRecords.flatMap((list) => list.movies.map((movie) => movie.id)) : movieRecords.map((movie) => movie.id);
  const tagsByMovie = await listTagsForMoviesForUser(user.id, movieIds);
  const lists = listRecords.map((list) => ({
    id: list.id,
    title: list.name,
    date: formatDate(list.createdAt),
    movies: list.movies.map((movie) => presentMovie(movie, tagsByMovie[movie.id])),
  }));

  return <MovieLedger activeTagId={activeTagId} tagOptions={tagOptions} status={status} view={view} movies={movieRecords.map((movie) => presentMovie(movie, tagsByMovie[movie.id]))} lists={lists} showCreateList={status === "lists" && first(query.new) === "list"} />;
}
