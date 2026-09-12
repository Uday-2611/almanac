import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { books, bookTags, movies, movieTags, tags } from "@/lib/db/schema";
import type { BookStatus } from "@/lib/db/queries/books";
import type { MovieStatus } from "@/lib/db/queries/movies";

export type TagRecord = typeof tags.$inferSelect;

export function normalizeTagName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export async function listTagsForUser(userId: string) {
  return getDatabase().select().from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(asc(tags.normalizedName));
}

export async function createTagForUser(userId: string, name: string) {
  const cleanName = name.normalize("NFKC").trim().replace(/\s+/g, " ");
  const normalizedName = normalizeTagName(cleanName);
  const [created] = await getDatabase().insert(tags)
    .values({ userId, name: cleanName, normalizedName })
    .onConflictDoNothing({ target: [tags.userId, tags.normalizedName] })
    .returning();

  if (created) return { tag: created, created: true };

  const [existing] = await getDatabase().select().from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.normalizedName, normalizedName)))
    .limit(1);
  if (!existing) throw new Error("The tag could not be created or retrieved.");
  return { tag: existing, created: false };
}

export async function listMovieTagOptionsForUser(userId: string, status: MovieStatus) {
  return getDatabase()
    .selectDistinct({ id: tags.id, name: tags.name, normalizedName: tags.normalizedName })
    .from(tags)
    .innerJoin(movieTags, eq(tags.id, movieTags.tagId))
    .innerJoin(movies, eq(movieTags.movieId, movies.id))
    .where(and(eq(tags.userId, userId), eq(movies.userId, userId), eq(movies.status, status)))
    .orderBy(asc(tags.normalizedName));
}

export async function listBookTagOptionsForUser(userId: string, status: BookStatus) {
  return getDatabase()
    .selectDistinct({ id: tags.id, name: tags.name, normalizedName: tags.normalizedName })
    .from(tags)
    .innerJoin(bookTags, eq(tags.id, bookTags.tagId))
    .innerJoin(books, eq(bookTags.bookId, books.id))
    .where(and(eq(tags.userId, userId), eq(books.userId, userId), eq(books.status, status)))
    .orderBy(asc(tags.normalizedName));
}

export async function listTagsForMoviesForUser(userId: string, movieIds: string[]) {
  if (!movieIds.length) return {} as Record<string, TagRecord[]>;
  const rows = await getDatabase()
    .select({ movieId: movieTags.movieId, tag: tags })
    .from(movieTags)
    .innerJoin(tags, eq(movieTags.tagId, tags.id))
    .innerJoin(movies, eq(movieTags.movieId, movies.id))
    .where(and(inArray(movieTags.movieId, movieIds), eq(movies.userId, userId), eq(tags.userId, userId)))
    .orderBy(asc(tags.normalizedName));

  return rows.reduce<Record<string, TagRecord[]>>((grouped, row) => {
    (grouped[row.movieId] ??= []).push(row.tag);
    return grouped;
  }, {});
}

export async function listTagsForBooksForUser(userId: string, bookIds: string[]) {
  if (!bookIds.length) return {} as Record<string, TagRecord[]>;
  const rows = await getDatabase()
    .select({ bookId: bookTags.bookId, tag: tags })
    .from(bookTags)
    .innerJoin(tags, eq(bookTags.tagId, tags.id))
    .innerJoin(books, eq(bookTags.bookId, books.id))
    .where(and(inArray(bookTags.bookId, bookIds), eq(books.userId, userId), eq(tags.userId, userId)))
    .orderBy(asc(tags.normalizedName));

  return rows.reduce<Record<string, TagRecord[]>>((grouped, row) => {
    (grouped[row.bookId] ??= []).push(row.tag);
    return grouped;
  }, {});
}

export async function listTagsForMovieForUser(userId: string, movieId: string) {
  const grouped = await listTagsForMoviesForUser(userId, [movieId]);
  return grouped[movieId] ?? [];
}

export async function listTagsForBookForUser(userId: string, bookId: string) {
  const grouped = await listTagsForBooksForUser(userId, [bookId]);
  return grouped[bookId] ?? [];
}

export async function attachTagToMovieForUser(userId: string, movieId: string, name: string) {
  const [ownedMovie] = await getDatabase().select({ id: movies.id }).from(movies)
    .where(and(eq(movies.id, movieId), eq(movies.userId, userId))).limit(1);
  if (!ownedMovie) return null;

  const { tag } = await createTagForUser(userId, name);
  await getDatabase().insert(movieTags).values({ movieId, tagId: tag.id }).onConflictDoNothing();
  return tag;
}

export async function attachTagToBookForUser(userId: string, bookId: string, name: string) {
  const [ownedBook] = await getDatabase().select({ id: books.id }).from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId))).limit(1);
  if (!ownedBook) return null;

  const { tag } = await createTagForUser(userId, name);
  await getDatabase().insert(bookTags).values({ bookId, tagId: tag.id }).onConflictDoNothing();
  return tag;
}

export async function removeTagFromMovieForUser(userId: string, movieId: string, tagId: string) {
  const [ownedMovie] = await getDatabase().select({ id: movies.id }).from(movies)
    .where(and(eq(movies.id, movieId), eq(movies.userId, userId))).limit(1);
  if (!ownedMovie) return false;

  const [ownedTag] = await getDatabase().select({ id: tags.id }).from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId))).limit(1);
  if (!ownedTag) return true;

  await getDatabase().delete(movieTags)
    .where(and(eq(movieTags.movieId, movieId), eq(movieTags.tagId, tagId)));
  return true;
}

export async function removeTagFromBookForUser(userId: string, bookId: string, tagId: string) {
  const [ownedBook] = await getDatabase().select({ id: books.id }).from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId))).limit(1);
  if (!ownedBook) return false;

  const [ownedTag] = await getDatabase().select({ id: tags.id }).from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId))).limit(1);
  if (!ownedTag) return true;

  await getDatabase().delete(bookTags)
    .where(and(eq(bookTags.bookId, bookId), eq(bookTags.tagId, tagId)));
  return true;
}
