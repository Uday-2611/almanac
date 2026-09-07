import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { movieListItems, movieLists, movies } from "@/lib/db/schema";
import type { TmdbMovie } from "@/lib/providers/tmdb";

export type MovieStatus = "watchlist" | "watched";
export type MovieRecord = typeof movies.$inferSelect;
export type MovieListRecord = typeof movieLists.$inferSelect & { movies: MovieRecord[] };

export class MovieListEligibilityError extends Error {}

export async function listMoviesForUser(userId: string, status: MovieStatus) {
  return getDatabase()
    .select()
    .from(movies)
    .where(and(eq(movies.userId, userId), eq(movies.status, status)))
    .orderBy(desc(movies.loggedDate), desc(movies.createdAt));
}

export async function getMovieForUser(userId: string, movieId: string) {
  const [movie] = await getDatabase()
    .select()
    .from(movies)
    .where(and(eq(movies.id, movieId), eq(movies.userId, userId)))
    .limit(1);

  return movie ?? null;
}

export async function getMovieByTmdbId(userId: string, tmdbId: number) {
  const [movie] = await getDatabase()
    .select()
    .from(movies)
    .where(and(eq(movies.tmdbId, tmdbId), eq(movies.userId, userId)))
    .limit(1);

  return movie ?? null;
}

export async function createMovieForUser(userId: string, movie: TmdbMovie, status: MovieStatus) {
  const existing = await getMovieByTmdbId(userId, movie.tmdbId);
  if (existing) return { movie: existing, created: false };

  const [created] = await getDatabase()
    .insert(movies)
    .values({
      userId,
      tmdbId: movie.tmdbId,
      title: movie.title,
      director: movie.director,
      overview: movie.overview || null,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      releaseDate: movie.releaseDate,
      runtimeMinutes: movie.runtimeMinutes,
      cast: movie.cast,
      status,
      loggedDate: status === "watched" ? new Date().toISOString().slice(0, 10) : null,
    })
    .returning();

  return { movie: created, created: true };
}

export async function updateMovieForUser(
  userId: string,
  movieId: string,
  input: { status?: MovieStatus; rating?: number | null; review?: string | null; loggedDate?: string | null },
) {
  const current = await getMovieForUser(userId, movieId);
  if (!current) return null;

  const values: Partial<typeof movies.$inferInsert> = { updatedAt: new Date() };

  if (input.status === "watched") {
    values.status = "watched";
    values.loggedDate = input.loggedDate ?? current.loggedDate ?? new Date().toISOString().slice(0, 10);
  } else if (input.status === "watchlist") {
    values.status = "watchlist";
    values.loggedDate = null;
    values.rating = null;
    values.review = null;
  }

  const resultingStatus = input.status ?? current.status;
  if (resultingStatus === "watched") {
    if (input.rating !== undefined) values.rating = input.rating;
    if (input.review !== undefined) values.review = input.review;
    if (input.loggedDate !== undefined) values.loggedDate = input.loggedDate;
  }

  const [updated] = await getDatabase()
    .update(movies)
    .set(values)
    .where(and(eq(movies.id, movieId), eq(movies.userId, userId)))
    .returning();

  return updated ?? null;
}

export async function deleteMovieForUser(userId: string, movieId: string) {
  const [deleted] = await getDatabase()
    .delete(movies)
    .where(and(eq(movies.id, movieId), eq(movies.userId, userId)))
    .returning({ id: movies.id });

  return deleted ?? null;
}

export async function listMovieListsForUser(userId: string): Promise<MovieListRecord[]> {
  const lists = await getDatabase()
    .select()
    .from(movieLists)
    .where(eq(movieLists.userId, userId))
    .orderBy(desc(movieLists.createdAt));

  if (!lists.length) return [];

  const items = await getDatabase()
    .select({ listId: movieListItems.listId, movie: movies })
    .from(movieListItems)
    .innerJoin(movies, eq(movieListItems.movieId, movies.id))
    .where(and(inArray(movieListItems.listId, lists.map((list) => list.id)), eq(movies.userId, userId)))
    .orderBy(desc(movieListItems.createdAt));

  return lists.map((list) => ({
    ...list,
    movies: items.filter((item) => item.listId === list.id).map((item) => item.movie),
  }));
}

export async function createMovieListForUser(userId: string, name: string) {
  const [list] = await getDatabase()
    .insert(movieLists)
    .values({ userId, name })
    .onConflictDoNothing({ target: [movieLists.userId, movieLists.name] })
    .returning();

  if (list) return list;

  const [existing] = await getDatabase()
    .select()
    .from(movieLists)
    .where(and(eq(movieLists.userId, userId), eq(movieLists.name, name)))
    .limit(1);

  return existing;
}

export async function renameMovieListForUser(userId: string, listId: string, name: string) {
  const [updated] = await getDatabase()
    .update(movieLists)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(movieLists.id, listId), eq(movieLists.userId, userId)))
    .returning();

  return updated ?? null;
}

export async function deleteMovieListForUser(userId: string, listId: string) {
  const [deleted] = await getDatabase()
    .delete(movieLists)
    .where(and(eq(movieLists.id, listId), eq(movieLists.userId, userId)))
    .returning({ id: movieLists.id });

  return deleted ?? null;
}

export async function addMovieToListForUser(userId: string, listId: string, movieId: string) {
  const [eligible] = await getDatabase()
    .select({ listId: movieLists.id, movieId: movies.id })
    .from(movieLists)
    .innerJoin(movies, and(eq(movies.id, movieId), eq(movies.userId, movieLists.userId)))
    .where(and(eq(movieLists.id, listId), eq(movieLists.userId, userId), eq(movies.status, "watched")))
    .limit(1);

  if (!eligible) {
    throw new MovieListEligibilityError("Only movies in your Watched collection can be added to your lists.");
  }

  await getDatabase().insert(movieListItems).values({ listId, movieId }).onConflictDoNothing();
}

export async function removeMovieFromListForUser(userId: string, listId: string, movieId: string) {
  const [ownedList] = await getDatabase()
    .select({ id: movieLists.id })
    .from(movieLists)
    .where(and(eq(movieLists.id, listId), eq(movieLists.userId, userId)))
    .limit(1);

  if (!ownedList) return false;

  const [deleted] = await getDatabase()
    .delete(movieListItems)
    .where(and(eq(movieListItems.listId, listId), eq(movieListItems.movieId, movieId)))
    .returning({ movieId: movieListItems.movieId });

  return Boolean(deleted);
}

export async function listIdsForMovie(userId: string, movieId: string) {
  const rows = await getDatabase()
    .select({ listId: movieListItems.listId })
    .from(movieListItems)
    .innerJoin(movieLists, eq(movieListItems.listId, movieLists.id))
    .where(and(eq(movieListItems.movieId, movieId), eq(movieLists.userId, userId)));

  return rows.map((row) => row.listId);
}
