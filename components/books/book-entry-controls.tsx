"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CreateBookListForm } from "@/components/books/create-book-list-form";
import { ReviewMarkdown } from "@/components/media/review-markdown";
import { InteractionSkeleton } from "@/components/states/interaction-skeleton";

type ListOption = { id: string; name: string };

type BookEntryControlsProps = {
  author: string;
  bookId: string;
  contributors: string[];
  loggedDate: string | null;
  lists: ListOption[];
  overview: string | null | undefined;
  pageCount: number | null;
  rating: number | null;
  review: string | null;
  selectedListIds: string[];
  status: "want_to_read" | "read";
  title: string;
  year: string;
};

export function BookEntryControls({ author, bookId, contributors, loggedDate, lists, overview, pageCount, rating, review, selectedListIds, status, title, year }: BookEntryControlsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingLabel, setPendingLabel] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [activeListIds, setActiveListIds] = useState(selectedListIds);
  const [isPending, startTransition] = useTransition();

  function mutate(payload: Record<string, unknown>, label: string, onSuccess?: () => void) {
    setError("");
    setPendingLabel(label);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/books/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = response.ok ? null : await response.json().catch(() => null);
        if (!response.ok) return setError(data?.error ?? "The book could not be updated.");
        onSuccess?.();
        router.refresh();
      } catch {
        setError("The book could not be updated. Check your connection and try again.");
      }
    });
  }

  function saveReview(formData: FormData) {
    mutate({ review: String(formData.get("review") ?? "").trim() || null }, "Saving read details", () => setIsEditingReview(false));
  }

  function toggleList(listId: string, selected: boolean) {
    setError("");
    setPendingLabel(selected ? "Adding book to list" : "Removing book from list");
    const previousListIds = activeListIds;
    setActiveListIds((current) => selected ? [...current, listId] : current.filter((id) => id !== listId));
    startTransition(async () => {
      try {
        const url = selected ? `/api/book-lists/${listId}/books` : `/api/book-lists/${listId}/books/${bookId}`;
        const response = await fetch(url, {
          method: selected ? "POST" : "DELETE",
          headers: selected ? { "Content-Type": "application/json" } : undefined,
          body: selected ? JSON.stringify({ bookId }) : undefined,
        });
        const data = response.ok ? null : await response.json().catch(() => null);
        if (!response.ok) {
          setActiveListIds(previousListIds);
          return setError(data?.error ?? "The list could not be updated.");
        }
      } catch {
        setActiveListIds(previousListIds);
        setError("The list could not be updated. Check your connection and try again.");
      }
    });
  }

  function deleteBook() {
    setError("");
    setPendingLabel("Deleting book");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
        const data = response.ok ? null : await response.json().catch(() => null);
        if (!response.ok) return setError(data?.error ?? "The book could not be deleted.");
        router.replace(`/books?status=${status === "read" ? "read" : "want-to-read"}&view=list`);
        router.refresh();
      } catch {
        setError("The book could not be deleted. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="pb-2 pr-1 text-[#111111]">
      <header className="pb-7 pr-11">
        <h1 id="media-info-title" className="text-[3rem] font-semibold leading-[0.94] tracking-[-0.05em] text-[#111111] sm:text-[3.65rem]">{title}</h1>
        <p className="mt-3 text-sm font-medium tracking-[-0.01em] text-black/75">{author} <span aria-hidden="true" className="px-1 text-black/30">|</span> {year}</p>
      </header>

      {status === "read" ? (
        <>
          <section className="py-5" aria-labelledby="book-rating-heading">
            <h2 id="book-rating-heading" className="sr-only">Your rating</h2>
            <div className="flex items-center gap-1 text-[1.7rem] leading-none" aria-label={`Your rating: ${rating ?? "not rated"}`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" aria-label={`Rate ${value} out of 5`} aria-pressed={rating === value} disabled={isPending} onClick={() => mutate({ rating: value }, "Saving rating")} className={`movie-info-focus transition-[color,transform] duration-200 active:scale-90 disabled:opacity-50 ${value <= (rating ?? 0) ? "text-[#111111]" : "text-black/20 hover:text-black/50"}`}>★</button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-black/50">
              <span>Finished</span><span aria-hidden="true">/</span>
              <input aria-label="Date finished" type="date" defaultValue={loggedDate ?? ""} disabled={isPending} onChange={(event) => mutate({ loggedDate: event.currentTarget.value || null }, "Saving finished date")} className="movie-info-focus min-w-0 bg-transparent font-mono text-[11px] tracking-normal text-black/70 [color-scheme:light] disabled:opacity-50" />
            </label>
          </section>

          <BookOverview overview={overview} pageCount={pageCount} />

          <section aria-labelledby="book-review-heading" className="py-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <h2 id="book-review-heading" className="text-[11px] uppercase tracking-[0.12em] text-black/45">Your review</h2>
              {!isEditingReview ? <button type="button" onClick={() => setIsEditingReview(true)} className="movie-info-focus text-xs underline decoration-black/30 underline-offset-4 hover:decoration-black">Edit</button> : null}
            </div>
            {isEditingReview ? (
              <form action={saveReview} className="rounded-[4px] bg-black/[0.045] p-3">
                <textarea name="review" defaultValue={review ?? ""} rows={6} autoFocus className="movie-info-focus block w-full resize-y bg-transparent text-sm leading-6 text-[#111111] placeholder:text-black/35" placeholder="Write what stayed with you…" />
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <button type="submit" disabled={isPending} className="movie-info-focus font-medium underline underline-offset-4 disabled:opacity-50">Save review</button>
                  <button type="button" disabled={isPending} onClick={() => setIsEditingReview(false)} className="movie-info-focus text-black/55 underline underline-offset-4">Cancel</button>
                </div>
              </form>
            ) : <div className="rounded-[4px] bg-black/[0.045] p-3 text-sm text-black/85"><ReviewMarkdown source={review || "No review has been written yet."} /></div>}
          </section>

          <section className="py-5">
            <a href={`/books/${bookId}/archive-note`} className="group movie-info-focus inline-flex items-center bg-black/[0.07] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-[background-color,transform] duration-200 hover:bg-black/[0.12] active:scale-[0.98]">
              Open archive note
              <span aria-hidden="true" className="ml-8 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </a>
            <p className="mt-2 max-w-sm text-xs leading-5 text-black/45">A full-page journal for detailed thoughts, references, and tags.</p>
          </section>

          <section aria-labelledby="contributors-heading" className="py-5">
            <h2 id="contributors-heading" className="mb-2 text-[11px] uppercase tracking-[0.12em] text-black/45">Contributors</h2>
            <ul className="columns-2 gap-x-6 text-xs leading-6 text-black/70">
              {(contributors.length ? contributors : ["Contributor information is unavailable."]).map((person) => <li key={person} className="break-inside-avoid truncate">{person}</li>)}
            </ul>
          </section>

          <fieldset disabled={isPending} className="py-5">
            <legend className="mb-2 text-[11px] uppercase tracking-[0.12em] text-black/45">Add to lists</legend>
            {lists.length ? lists.map((list) => (
              <label key={list.id} className="flex cursor-pointer items-center justify-between py-2 text-sm text-black/80">
                <span>{list.name}</span>
                <input className="size-3 accent-black" type="checkbox" checked={activeListIds.includes(list.id)} onChange={(event) => toggleList(list.id, event.currentTarget.checked)} />
              </label>
            )) : <p className="text-sm text-black/50">This book is not in a custom list yet.</p>}
          </fieldset>

          <div className="py-4">
            <button type="button" disabled={isPending} onClick={() => setIsCreatingList((current) => !current)} className="movie-info-focus text-sm underline decoration-black/30 underline-offset-4 disabled:opacity-50">{isCreatingList ? "Cancel new list" : "Create a new list +"}</button>
            {isCreatingList ? <CreateBookListForm bookId={bookId} compact onBookAdded={(listId) => { setActiveListIds((current) => current.includes(listId) ? current : [...current, listId]); setIsCreatingList(false); }} /> : null}
          </div>
        </>
      ) : (
        <div className="space-y-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-black/45">Want to read</p>
          <BookOverview overview={overview} pageCount={pageCount} />
          <button type="button" disabled={isPending} onClick={() => mutate({ status: "read" }, "Marking book as read")} className="movie-info-focus bg-black/[0.07] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-[background-color,transform] duration-200 hover:bg-black/[0.12] active:scale-[0.98] disabled:opacity-50">Mark as read</button>
          <p className="text-xs leading-5 text-black/45">Want to Read books can be added to custom lists after they are marked read.</p>
        </div>
      )}

      {isPending ? <InteractionSkeleton label={pendingLabel} /> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      <div className="pt-4 text-xs">
        {status === "read" ? <button type="button" disabled={isPending} onClick={() => mutate({ status: "want_to_read" }, "Moving book to Want to Read")} className="movie-info-focus mb-4 block text-black/50 underline underline-offset-4 hover:text-[#111111] disabled:opacity-50">Move to Want to Read and clear read details</button> : null}
        {isConfirmingDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-black/55">Remove this book and its saved review?</span>
            <button type="button" disabled={isPending} onClick={deleteBook} className="movie-info-focus text-red-700 underline underline-offset-4 disabled:opacity-50">Delete permanently</button>
            <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(false)} className="movie-info-focus text-black/55 underline underline-offset-4">Cancel</button>
          </div>
        ) : <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(true)} className="movie-info-focus text-black/50 underline underline-offset-4 hover:text-[#111111] disabled:opacity-50">Delete book</button>}
      </div>
    </div>
  );
}

function BookOverview({ overview, pageCount }: { overview: string | null | undefined; pageCount: number | null }) {
  return (
    <section aria-labelledby="book-overview-heading" className="py-5">
      <h2 id="book-overview-heading" className="mb-2 text-[11px] uppercase tracking-[0.12em] text-black/45">Overview</h2>
      <p className="text-sm leading-6 text-black/80">{overview || "No overview is available."}</p>
      <p className="mt-3 text-xs text-black/45">{pageCount ? `${pageCount} pages` : "Page count unavailable"}</p>
    </section>
  );
}
