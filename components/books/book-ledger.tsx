import Link from "next/link";

import { BookSpineShelf } from "@/components/books/book-spine-shelf";
import { AnimatedLedgerList } from "@/components/ledger/animated-ledger-list";
import { SearchTrigger } from "@/components/search/search-trigger";

export type BookStatus = "want-to-read" | "read" | "lists";
export type BookView = "images" | "list";

export type Book = {
  id: string;
  title: string;
  author: string;
  date: string;
};

export const books: Book[] = [
  { id: "the-left-hand-of-darkness", title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", date: "August 21, 2026" },
  { id: "stoner", title: "Stoner", author: "John Williams", date: "August 16, 2026" },
  { id: "the-summer-book", title: "The Summer Book", author: "Tove Jansson", date: "August 10, 2026" },
  { id: "beloved", title: "Beloved", author: "Toni Morrison", date: "August 2, 2026" },
  { id: "the-books-of-jacob", title: "The Books of Jacob", author: "Olga Tokarczuk", date: "July 24, 2026" },
  { id: "a-month-in-the-country", title: "A Month in the Country", author: "J. L. Carr", date: "July 17, 2026" },
  { id: "the-dispossessed", title: "The Dispossessed", author: "Ursula K. Le Guin", date: "July 8, 2026" },
  { id: "outline", title: "Outline", author: "Rachel Cusk", date: "June 29, 2026" },
];

const spineHeights = [220, 185, 214, 124];
const shelfBooks = Array.from({ length: 40 }, (_, index) => ({
  ...books[index % books.length],
  height: spineHeights[index % spineHeights.length],
}));

function hrefFor(status: BookStatus, view: BookView) {
  return { pathname: "/books", query: { status, view } };
}

function Toggle({
  label,
  active,
  options,
}: {
  label: string;
  active: string;
  options: { label: string; value: string; href: ReturnType<typeof hrefFor> }[];
}) {
  return (
    <nav aria-label={label} className="flex items-center whitespace-nowrap">
      {options.map((option, index) => (
        <span key={option.value} className="flex items-center">
          {index ? <span aria-hidden="true" className="mx-1">/</span> : null}
          <Link
            href={option.href}
            aria-current={option.value === active ? "page" : undefined}
            className={option.value === active ? "ledger-focus text-[#111111]" : "ledger-focus text-[#686868] hover:text-[#111111]"}
          >
            {option.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function BookToolbar({ status, view }: { status: BookStatus; view: BookView }) {
  return (
    <div className="absolute left-4 right-4 top-14 z-10 flex justify-between gap-2 text-[11px] leading-none sm:left-5 sm:right-5 sm:top-5 sm:justify-end sm:text-base md:gap-[clamp(3rem,15vw,12.25rem)]">
      <Toggle
        label="Book display"
        active={view}
        options={[
          { label: "Image View", value: "images", href: hrefFor(status, "images") },
          { label: "List View", value: "list", href: hrefFor(status, "list") },
        ]}
      />
      <Toggle
        label="Book collection"
        active={status}
        options={[
          { label: "Want to Read", value: "want-to-read", href: hrefFor("want-to-read", view) },
          { label: "Read", value: "read", href: hrefFor("read", view) },
          { label: "My Lists", value: "lists", href: hrefFor("lists", view) },
        ]}
      />
    </div>
  );
}

function BookList() {
  return (
    <AnimatedLedgerList
      className="mt-[23px] w-full max-w-[44rem] pl-3"
      items={books.map((book) => ({
        id: book.id,
        href: `/books/${book.id}`,
        date: book.date,
        title: book.title,
        creator: book.author,
      }))}
    />
  );
}

export function BookLedger({ status, view }: { status: BookStatus; view: BookView }) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-[192px] sm:px-5 sm:pt-[195px]">
      <h1 className="sr-only">Books</h1>
      <BookToolbar status={status} view={view} />
      <SearchTrigger label="Add New +" scope="book" className="inline-flex text-sm sm:text-base" />
      {view === "images" ? <BookSpineShelf books={shelfBooks} /> : <BookList />}
    </main>
  );
}
