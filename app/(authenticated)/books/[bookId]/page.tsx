import { books } from "@/components/books/book-ledger";
import { MediaInfoCard, type MediaInfo } from "@/components/media/media-info-card";

const bookDetails: Record<string, Pick<MediaInfo, "year" | "rating" | "review" | "tags" | "people">> = {
  "the-left-hand-of-darkness": {
    year: "1969",
    rating: 5,
    review: "A political journey that gradually becomes an intimate study of trust. The long crossing over the ice gives every earlier argument room to change shape.",
    tags: ["science fiction", "winter", "politics"],
    people: ["Ursula K. Le Guin — author", "David Mitchell — introduction"],
  },
  stoner: {
    year: "1965",
    rating: 4.5,
    review: "Quietly devastating because it never asks an ordinary life to become extraordinary before it is worthy of attention.",
    tags: ["campus", "American", "quiet lives"],
    people: ["John Williams — author", "John McGahern — introduction"],
  },
};

export default async function BookDetailPage({ params }: PageProps<"/books/[bookId]">) {
  const { bookId } = await params;
  const book = books.find((entry) => entry.id === bookId);
  const details = bookDetails[bookId];

  const info: MediaInfo = {
    kind: "Book",
    title: book?.title ?? bookId.replaceAll("-", " "),
    creator: book?.author ?? "Author unavailable",
    creatorLabel: "Author",
    year: details?.year ?? "—",
    rating: details?.rating ?? null,
    review: details?.review ?? "No review has been written yet.",
    loggedAt: book?.date ?? "Not logged",
    tags: details?.tags ?? ["untagged"],
    peopleLabel: "Contributors",
    people: details?.people ?? [book?.author ? `${book.author} — author` : "Contributor information unavailable"],
  };

  return <MediaInfoCard info={info} backHref="/books" />;
}
