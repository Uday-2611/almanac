import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { bookListItems, bookLists, books } from "@/lib/db/schema";

export type BookStatus = "want_to_read" | "read";
export type BookProvider = "open_library" | "google_books";
export type BookRecord = typeof books.$inferSelect;
export type BookListRecord = typeof bookLists.$inferSelect & { books: BookRecord[] };
export type BookProviderMetadata = {
  provider: BookProvider;
  providerId: string;
  title: string;
  authors: string[];
  contributors: string[];
  description: string | null;
  coverUrl: string | null;
  publishDate: string | null;
  pageCount: number | null;
};

export class BookListEligibilityError extends Error {}

export async function listBooksForUser(userId: string, status: BookStatus) {
  return getDatabase().select().from(books)
    .where(and(eq(books.userId, userId), eq(books.status, status)))
    .orderBy(desc(books.loggedDate), desc(books.createdAt));
}

export async function getBookForUser(userId: string, bookId: string) {
  const [book] = await getDatabase().select().from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId))).limit(1);
  return book ?? null;
}

export async function getBookByProviderId(userId: string, provider: BookProvider, providerId: string) {
  const [book] = await getDatabase().select().from(books)
    .where(and(eq(books.userId, userId), eq(books.provider, provider), eq(books.providerId, providerId))).limit(1);
  return book ?? null;
}

export async function createBookForUser(userId: string, metadata: BookProviderMetadata, status: BookStatus) {
  const [created] = await getDatabase().insert(books).values({
    userId,
    provider: metadata.provider,
    providerId: metadata.providerId,
    title: metadata.title,
    authors: metadata.authors,
    contributors: metadata.contributors,
    description: metadata.description,
    coverUrl: metadata.coverUrl,
    publishDate: metadata.publishDate,
    pageCount: metadata.pageCount,
    status,
    loggedDate: status === "read" ? new Date().toISOString().slice(0, 10) : null,
  }).onConflictDoNothing({ target: [books.userId, books.provider, books.providerId] }).returning();

  if (created) return { book: created, created: true };

  const existing = await getBookByProviderId(userId, metadata.provider, metadata.providerId);
  if (!existing) throw new Error("The book could not be created or retrieved.");
  return { book: existing, created: false };
}

export async function updateBookForUser(
  userId: string,
  bookId: string,
  input: { status?: BookStatus; rating?: number | null; review?: string | null; loggedDate?: string | null },
) {
  const current = await getBookForUser(userId, bookId);
  if (!current) return null;

  const values: Partial<typeof books.$inferInsert> = { updatedAt: new Date() };
  if (input.status === "read") {
    values.status = "read";
    values.loggedDate = input.loggedDate ?? current.loggedDate ?? new Date().toISOString().slice(0, 10);
  } else if (input.status === "want_to_read") {
    values.status = "want_to_read";
    values.loggedDate = null;
    values.rating = null;
    values.review = null;
  }

  if ((input.status ?? current.status) === "read") {
    if (input.rating !== undefined) values.rating = input.rating;
    if (input.review !== undefined) values.review = input.review;
    if (input.loggedDate !== undefined) values.loggedDate = input.loggedDate;
  }

  const [updated] = await getDatabase().update(books).set(values)
    .where(and(eq(books.id, bookId), eq(books.userId, userId))).returning();
  return updated ?? null;
}

export async function deleteBookForUser(userId: string, bookId: string) {
  const [deleted] = await getDatabase().delete(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId))).returning({ id: books.id });
  return deleted ?? null;
}

export async function listBookListsForUser(userId: string): Promise<BookListRecord[]> {
  const lists = await getDatabase().select().from(bookLists)
    .where(eq(bookLists.userId, userId)).orderBy(desc(bookLists.createdAt));
  if (!lists.length) return [];

  const items = await getDatabase().select({ listId: bookListItems.listId, book: books })
    .from(bookListItems).innerJoin(books, eq(bookListItems.bookId, books.id))
    .where(and(inArray(bookListItems.listId, lists.map((list) => list.id)), eq(books.userId, userId)))
    .orderBy(desc(bookListItems.createdAt));

  return lists.map((list) => ({
    ...list,
    books: items.filter((item) => item.listId === list.id).map((item) => item.book),
  }));
}

export async function createBookListForUser(userId: string, name: string) {
  const [list] = await getDatabase().insert(bookLists).values({ userId, name })
    .onConflictDoNothing({ target: [bookLists.userId, bookLists.name] }).returning();
  if (list) return list;

  const [existing] = await getDatabase().select().from(bookLists)
    .where(and(eq(bookLists.userId, userId), eq(bookLists.name, name))).limit(1);
  return existing;
}

export async function renameBookListForUser(userId: string, listId: string, name: string) {
  const [updated] = await getDatabase().update(bookLists).set({ name, updatedAt: new Date() })
    .where(and(eq(bookLists.id, listId), eq(bookLists.userId, userId))).returning();
  return updated ?? null;
}

export async function deleteBookListForUser(userId: string, listId: string) {
  const [deleted] = await getDatabase().delete(bookLists)
    .where(and(eq(bookLists.id, listId), eq(bookLists.userId, userId))).returning({ id: bookLists.id });
  return deleted ?? null;
}

export async function addBookToListForUser(userId: string, listId: string, bookId: string) {
  const [eligible] = await getDatabase().select({ listId: bookLists.id, bookId: books.id })
    .from(bookLists).innerJoin(books, and(eq(books.id, bookId), eq(books.userId, bookLists.userId)))
    .where(and(eq(bookLists.id, listId), eq(bookLists.userId, userId), eq(books.status, "read"))).limit(1);
  if (!eligible) throw new BookListEligibilityError("Only books in your Read collection can be added to your lists.");
  await getDatabase().insert(bookListItems).values({ listId, bookId }).onConflictDoNothing();
}

export async function removeBookFromListForUser(userId: string, listId: string, bookId: string) {
  const [ownedList] = await getDatabase().select({ id: bookLists.id }).from(bookLists)
    .where(and(eq(bookLists.id, listId), eq(bookLists.userId, userId))).limit(1);
  if (!ownedList) return false;

  const [deleted] = await getDatabase().delete(bookListItems)
    .where(and(eq(bookListItems.listId, listId), eq(bookListItems.bookId, bookId)))
    .returning({ bookId: bookListItems.bookId });
  return Boolean(deleted);
}

export async function listIdsForBook(userId: string, bookId: string) {
  const rows = await getDatabase().select({ listId: bookListItems.listId }).from(bookListItems)
    .innerJoin(bookLists, eq(bookListItems.listId, bookLists.id))
    .where(and(eq(bookListItems.bookId, bookId), eq(bookLists.userId, userId)));
  return rows.map((row) => row.listId);
}
