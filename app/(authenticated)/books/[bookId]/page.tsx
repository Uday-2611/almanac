import { notFound } from "next/navigation";

import { BookEntryControls } from "@/components/books/book-entry-controls";
import { MediaInfoCard, type MediaInfo } from "@/components/media/media-info-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookForUser, listBookListOptionsForUser, listIdsForBook } from "@/lib/db/queries/books";
import { idSchema } from "@/lib/validation";

function formatLoggedDate(value: string | null) {
  if (!value) return "Not logged";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export async function getBookInfo(bookId: string) {
  if (!idSchema.safeParse(bookId).success) notFound();
  const user = await getCurrentUser();
  if (!user) notFound();

  const [book, lists, selectedListIds] = await Promise.all([
    getBookForUser(user.id, bookId),
    listBookListOptionsForUser(user.id),
    listIdsForBook(user.id, bookId),
  ]);
  if (!book) notFound();

  const author = book.authors.join(", ") || "Author unavailable";
  const contributors = book.contributors.length ? book.contributors : book.authors;
  const info: MediaInfo = {
    kind: "Book",
    title: book.title,
    creator: author,
    creatorLabel: "Author",
    year: book.publishDate?.slice(0, 4) ?? "Unknown",
    rating: book.rating,
    review: book.review ?? "No review has been written yet.",
    loggedAt: formatLoggedDate(book.loggedDate),
    tags: [],
    peopleLabel: "Contributors",
    people: contributors.length ? contributors : ["Contributor information is unavailable."],
    posterUrl: book.coverUrl,
    overview: book.description,
    details: [{ label: "Pages", value: book.pageCount ? String(book.pageCount) : "Unknown" }],
  };

  return {
    info,
    controls: {
      author,
      bookId: book.id,
      contributors,
      overview: book.description,
      pageCount: book.pageCount,
      status: book.status,
      title: book.title,
      year: book.publishDate?.slice(0, 4) ?? "Unknown",
      rating: book.rating,
      review: book.review,
      loggedDate: book.loggedDate,
      lists: lists.map((list) => ({ id: list.id, name: list.name })),
      selectedListIds,
    },
  };
}

export default async function BookDetailPage({ params }: PageProps<"/books/[bookId]">) {
  const { bookId } = await params;
  const { info, controls } = await getBookInfo(bookId);

  return <MediaInfoCard info={info} backHref="/books" actions={<BookEntryControls key={controls.selectedListIds.join(":")} {...controls} />} />;
}
