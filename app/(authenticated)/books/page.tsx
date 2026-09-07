import type { Metadata } from "next";

import { BookLedger, type BookStatus, type BookView } from "@/components/books/book-ledger";

export const metadata: Metadata = { title: "Books" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BooksPage({ searchParams }: PageProps<"/books">) {
  const query = await searchParams;
  const requestedStatus = first(query.status);
  const requestedView = first(query.view);

  const status: BookStatus = requestedStatus === "want-to-read" || requestedStatus === "lists" ? requestedStatus : "read";
  const view: BookView = requestedView === "images" ? "images" : "list";

  return <BookLedger status={status} view={view} />;
}
