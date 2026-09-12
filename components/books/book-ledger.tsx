import Link from "next/link";

import { BookListDisclosure } from "@/components/books/book-list-disclosure";
import { BookCoverRail } from "@/components/books/book-cover-rail";
import { CreateBookListForm } from "@/components/books/create-book-list-form";
import { AnimatedLedgerList, type AnimatedLedgerItem } from "@/components/ledger/animated-ledger-list";
import { SearchTrigger } from "@/components/search/search-trigger";
import { EmptyState } from "@/components/states/empty-state";
import { TagFilter, type TagFilterOption } from "@/components/media/tag-filter";

export type BookStatus = "want-to-read" | "read" | "lists";
export type BookView = "images" | "list";

export type Book = {
  id: string;
  title: string;
  author: string;
  date: string;
  coverUrl: string | null;
  tags: string[];
};

export type BookList = {
  id: string;
  title: string;
  date: string;
  books: Book[];
};

function hrefFor(status: BookStatus, view: BookView, tag?: string) {
  return { pathname: "/books", query: { status, view, ...(tag ? { tag } : {}) } };
}

function TextToggle({ label, active, options }: {
  label: string;
  active: string;
  options: { label: string; value: string; href: ReturnType<typeof hrefFor> }[];
}) {
  return (
    <nav aria-label={label} className="flex items-center whitespace-nowrap">
      {options.map((option, index) => (
        <span key={option.value} className="flex items-center">
          {index > 0 ? <span aria-hidden="true" className="mx-1 text-[#111111]">/</span> : null}
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

function BookToolbar({ status, view, tag }: { status: BookStatus; view: BookView; tag?: string }) {
  return (
    <div className="absolute left-4 right-4 top-14 z-10 flex justify-between gap-2 text-[11px] leading-none sm:left-5 sm:right-5 sm:top-5 sm:justify-end sm:text-base md:gap-[clamp(3rem,15vw,12.25rem)]">
      <TextToggle label="Book display" active={view} options={[
        { label: "Image View", value: "images", href: hrefFor(status, "images", tag) },
        { label: "List View", value: "list", href: hrefFor(status, "list", tag) },
      ]} />
      <TextToggle label="Book collection" active={status} options={[
        { label: "Want to Read", value: "want-to-read", href: hrefFor("want-to-read", view, tag) },
        { label: "Read", value: "read", href: hrefFor("read", view, tag) },
        { label: "My Lists", value: "lists", href: hrefFor("lists", view) },
      ]} />
    </div>
  );
}

function AddLink({ lists, view }: { lists: boolean; view: BookView }) {
  if (!lists) return <SearchTrigger label="Add New +" scope="book" className="inline-flex text-sm sm:text-base" />;

  return (
    <Link href={{ pathname: "/books", query: { status: "lists", view, new: "list" } }} className="ledger-focus inline-flex items-center gap-1 text-sm sm:text-base">
      Create new list <span aria-hidden="true" className="text-lg leading-none">+</span>
    </Link>
  );
}

function toLedgerItems(books: Book[]): AnimatedLedgerItem[] {
  return books.map((book) => ({
    id: book.id,
    href: `/books/${book.id}`,
    date: book.date,
    title: book.title,
    creator: book.author,
    tags: book.tags,
  }));
}

function BookListView({ books }: { books: Book[] }) {
  return <AnimatedLedgerList className="mt-[23px] w-full max-w-[44rem] pl-3" items={toLedgerItems(books)} />;
}

function BookImageView({ books }: { books: Book[] }) {
  return <BookCoverRail books={books} />;
}

function ListsView({ lists, view }: { lists: BookList[]; view: BookView }) {
  return (
    <div className="mt-[29px] space-y-[55px] px-3 sm:space-y-[56px]">
      {lists.map((list) => (
        <BookListDisclosure key={list.id} date={list.date} id={list.id} title={list.title}>
          {list.books.length ? (
            view === "images" ? (
              <BookImageView books={list.books} />
            ) : (
              <AnimatedLedgerList items={toLedgerItems(list.books)} className="ml-0 mt-[25px] max-w-[44rem] border-l border-[#dedede] pl-5 sm:ml-[3.75rem]" />
            )
          ) : (
            <p className="ml-0 mt-6 text-sm text-[#686868] sm:ml-[3.75rem]">No read books in this list yet.</p>
          )}
        </BookListDisclosure>
      ))}
    </div>
  );
}

export function BookLedger({ status, view, books, lists, showCreateList, activeTagId, tagOptions }: {
  status: BookStatus;
  view: BookView;
  books: Book[];
  lists: BookList[];
  showCreateList: boolean;
  activeTagId?: string;
  tagOptions: TagFilterOption[];
}) {
  const activeTagName = tagOptions.find((tag) => tag.id === activeTagId)?.name;

  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 pb-16 pt-[192px] sm:px-5 sm:pt-[195px]">
      <h1 className="sr-only">Books</h1>
      <BookToolbar status={status} view={view} tag={activeTagId} />
      <AddLink lists={status === "lists"} view={view} />
      {status !== "lists" ? <TagFilter activeTagId={activeTagId} pathname="/books" query={{ status, view }} tags={tagOptions} /> : null}
      {showCreateList ? <CreateBookListForm /> : null}
      {status === "lists" ? (
        lists.length ? <ListsView lists={lists} view={view} /> : <div className="mt-8 text-[#686868]"><EmptyState message="No lists yet. Create one to organize books you have read." /></div>
      ) : books.length ? (
        view === "images" ? <BookImageView books={books} /> : <BookListView books={books} />
      ) : (
        <div className="mt-8 text-[#686868]"><EmptyState message={activeTagName ? `No books in ${status === "want-to-read" ? "Want to Read" : "Read"} use the tag “${activeTagName}”.` : status === "want-to-read" ? "Your Want to Read list is empty." : "You have not marked any books as read yet."} /></div>
      )}
    </main>
  );
}
