import { notFound } from "next/navigation";

import { ArchiveNotePage } from "@/components/media/archive-note-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookForUser } from "@/lib/db/queries/books";
import { idSchema } from "@/lib/validation";

export default async function BookArchiveNotePage({ params }: PageProps<"/books/[bookId]/archive-note">) {
  const { bookId } = await params;
  if (!idSchema.safeParse(bookId).success) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const book = await getBookForUser(user.id, bookId);
  if (!book) notFound();

  const author = book.authors.join(", ") || "Author unavailable";
  const year = book.publishDate?.slice(0, 4) ?? "Year unknown";

  return <ArchiveNotePage backHref={`/books/${book.id}`} backLabel="Book" creator={author} kind="Book" title={book.title} year={year} />;
}
