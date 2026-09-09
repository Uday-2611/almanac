import type { Metadata } from "next";

import { BookLedger, type BookStatus, type BookView } from "@/components/books/book-ledger";
import { getCurrentUser } from "@/lib/auth/session";
import { listBookListsForUser, listBooksForUser, type BookRecord } from "@/lib/db/queries/books";

export const metadata: Metadata = { title: "Books" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | Date | null) {
  if (!value) return "Not dated";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function presentBook(book: BookRecord) {
  return {
    id: book.id,
    title: book.title,
    author: book.authors.join(", ") || "Author unavailable",
    date: formatDate(book.loggedDate ?? book.createdAt),
    coverUrl: book.coverUrl,
  };
}

export default async function BooksPage({ searchParams }: PageProps<"/books">) {
  const query = await searchParams;
  const requestedStatus = first(query.status);
  const requestedView = first(query.view);

  const status: BookStatus = requestedStatus === "want-to-read" || requestedStatus === "lists" ? requestedStatus : "read";
  const view: BookView = requestedView === "images" ? "images" : "list";
  const user = await getCurrentUser();
  if (!user) return null;

  const listRecords = status === "lists" ? await listBookListsForUser(user.id) : [];
  const bookRecords = status === "lists" ? [] : await listBooksForUser(user.id, status === "want-to-read" ? "want_to_read" : "read");
  const lists = listRecords.map((list) => ({
    id: list.id,
    title: list.name,
    date: formatDate(list.createdAt),
    books: list.books.map(presentBook),
  }));

  return <BookLedger status={status} view={view} books={bookRecords.map(presentBook)} lists={lists} showCreateList={status === "lists" && first(query.new) === "list"} />;
}
