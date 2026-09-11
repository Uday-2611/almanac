"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ReviewMarkdown } from "@/components/media/review-markdown";
import { CreateMovieListForm } from "@/components/movies/create-movie-list-form";
import { InteractionSkeleton } from "@/components/states/interaction-skeleton";

type ListOption = { id: string; name: string };

export function MovieEntryControls({
  cast,
  creator,
  mediaType,
  movieId,
  overview,
  status,
  title,
  year,
  rating,
  review,
  loggedDate,
  lists,
  selectedListIds,
}: {
  cast: string[];
  creator: string;
  mediaType: "movie" | "tv";
  movieId: string;
  overview: string | null | undefined;
  status: "watchlist" | "watched";
  title: string;
  year: string;
  rating: number | null;
  review: string | null;
  loggedDate: string | null;
  lists: ListOption[];
  selectedListIds: string[];
}) {
  const entryNoun = mediaType === "tv" ? "show" : "movie";
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
      const response = await fetch(`/api/movies/${movieId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = response.ok ? null : await response.json().catch(() => null);
      if (!response.ok) return setError(data?.error ?? `The ${entryNoun} could not be updated.`);
      onSuccess?.();
      router.refresh();
    });
  }

  function saveReview(formData: FormData) {
    mutate({
      review: String(formData.get("review") ?? "").trim() || null,
    }, "Saving watched details", () => setIsEditingReview(false));
  }

  function toggleList(listId: string, selected: boolean) {
    setError("");
    setPendingLabel(selected ? "Adding movie to list" : "Removing movie from list");
    const previousListIds = activeListIds;
    setActiveListIds((current) => selected ? [...current, listId] : current.filter((id) => id !== listId));
    startTransition(async () => {
      const url = selected
        ? `/api/movie-lists/${listId}/movies`
        : `/api/movie-lists/${listId}/movies/${movieId}`;
      const response = await fetch(url, {
        method: selected ? "POST" : "DELETE",
        headers: selected ? { "Content-Type": "application/json" } : undefined,
        body: selected ? JSON.stringify({ movieId }) : undefined,
      });
      const data = response.ok ? null : await response.json().catch(() => null);
      if (!response.ok) {
        setActiveListIds(previousListIds);
        return setError(data?.error ?? "The list could not be updated.");
      }
    });
  }

  function deleteMovie() {
    setError("");
    setPendingLabel("Deleting movie");
    startTransition(async () => {
      const response = await fetch(`/api/movies/${movieId}`, { method: "DELETE" });
      const data = response.ok ? null : await response.json().catch(() => null);
      if (!response.ok) return setError(data?.error ?? `The ${entryNoun} could not be deleted.`);
      router.replace(`/movies?status=${status}&view=list`);
      router.refresh();
    });
  }

  return (
    <div className="pb-2 pr-1 text-[#111111]">
      <header className="pb-7 pr-11">
        <h1 id="media-info-title" className="text-[3rem] font-semibold leading-[0.94] tracking-[-0.05em] text-[#111111] sm:text-[3.65rem]">
          {title}
        </h1>
        <p className="mt-3 text-sm font-medium tracking-[-0.01em] text-black/75">
          {creator} <span aria-hidden="true" className="px-1 text-black/30">|</span> {year}
        </p>
      </header>

      {status === "watched" ? (
        <>
          <section className="py-5" aria-labelledby="rating-heading">
            <h2 id="rating-heading" className="sr-only">Your rating</h2>
            <div className="flex items-center gap-1 text-[1.7rem] leading-none" aria-label={`Your rating: ${rating ?? "not rated"}`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Rate ${value} out of 5`}
                  aria-pressed={rating === value}
                  disabled={isPending}
                  onClick={() => mutate({ rating: value }, "Saving rating")}
                  className={`movie-info-focus transition-[color,transform] duration-200 active:scale-90 disabled:opacity-50 ${value <= (rating ?? 0) ? "text-[#111111]" : "text-black/20 hover:text-black/50"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-black/50">
              <span>Watched</span>
              <span aria-hidden="true">/</span>
              <input aria-label="Date watched" type="date" defaultValue={loggedDate ?? ""} disabled={isPending} onChange={(event) => mutate({ loggedDate: event.currentTarget.value || null }, "Saving watched date")} className="movie-info-focus min-w-0 bg-transparent font-mono text-[11px] tracking-normal text-black/70 [color-scheme:light] disabled:opacity-50" />
            </label>
          </section>

          <section aria-labelledby="overview-heading" className="py-5">
            <h2 id="overview-heading" className="mb-2 text-[11px] uppercase tracking-[0.12em] text-black/45">Overview</h2>
            <p className="text-sm leading-6 text-black/80">{overview || "No overview is available."}</p>
          </section>

          <section aria-labelledby="review-heading" className="py-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <h2 id="review-heading" className="text-[11px] uppercase tracking-[0.12em] text-black/45">Your review</h2>
              {!isEditingReview ? (
                <button type="button" onClick={() => setIsEditingReview(true)} className="movie-info-focus text-xs underline decoration-black/30 underline-offset-4 hover:decoration-black">Edit</button>
              ) : null}
            </div>
            {isEditingReview ? (
              <form id="movie-review-form" action={saveReview} className="rounded-[4px] bg-black/[0.045] p-3">
                <textarea name="review" defaultValue={review ?? ""} rows={6} autoFocus className="movie-info-focus block w-full resize-y bg-transparent text-sm leading-6 text-[#111111] placeholder:text-black/35" placeholder="Write what stayed with you…" />
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <button type="submit" disabled={isPending} className="movie-info-focus font-medium underline underline-offset-4 disabled:opacity-50">Save review</button>
                  <button type="button" disabled={isPending} onClick={() => setIsEditingReview(false)} className="movie-info-focus text-black/55 underline underline-offset-4">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="rounded-[4px] bg-black/[0.045] p-3 text-sm text-black/85">
                <ReviewMarkdown source={review || "No review has been written yet."} />
              </div>
            )}
          </section>

          <section className="py-5">
            <a href={`/movies/${movieId}/archive-note`} className="group movie-info-focus inline-flex items-center bg-black/[0.07] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-[background-color,transform] duration-200 hover:bg-black/[0.12] active:scale-[0.98]">
              Open archive note
              <span aria-hidden="true" className="ml-8 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </a>
            <p className="mt-2 max-w-sm text-xs leading-5 text-black/45">A full-page journal for detailed thoughts, references, and tags.</p>
          </section>

          <section aria-labelledby="cast-heading" className="py-5">
            <h2 id="cast-heading" className="mb-2 text-[11px] uppercase tracking-[0.12em] text-black/45">Cast</h2>
            <ul className="columns-2 gap-x-6 text-xs leading-6 text-black/70">
              {cast.map((person) => <li key={person} className="break-inside-avoid truncate">{person}</li>)}
            </ul>
          </section>

          <fieldset disabled={isPending} className="py-5">
            <legend className="mb-2 text-[11px] uppercase tracking-[0.12em] text-black/45">Add to lists</legend>
            {lists.length ? lists.map((list) => (
              <label key={list.id} className="flex cursor-pointer items-center justify-between py-2 text-sm text-black/80">
                <span>{list.name}</span>
                <input className="size-3 accent-black" type="checkbox" checked={activeListIds.includes(list.id)} onChange={(event) => toggleList(list.id, event.currentTarget.checked)} />
              </label>
            )) : <p className="text-sm text-black/50">This {entryNoun} is not in a custom list yet.</p>}
          </fieldset>

          <div className="py-4">
            <button type="button" disabled={isPending} onClick={() => setIsCreatingList((current) => !current)} className="movie-info-focus text-sm underline decoration-black/30 underline-offset-4 disabled:opacity-50">
              {isCreatingList ? "Cancel new list" : "Create a new list +"}
            </button>
            {isCreatingList ? <CreateMovieListForm movieId={movieId} compact /> : null}
          </div>
        </>
      ) : (
        <div className="space-y-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-black/45">Watchlist</p>
          <p className="text-sm leading-6 text-black/80">{overview || "No overview is available."}</p>
          <button type="button" disabled={isPending} onClick={() => mutate({ status: "watched" }, `Moving ${entryNoun} to Watched`)} className="movie-info-focus bg-black/[0.07] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-[background-color,transform] duration-200 hover:bg-black/[0.12] active:scale-[0.98] disabled:opacity-50">
            Mark as watched
          </button>
          <p className="text-xs leading-5 text-black/45">Watchlist titles can be added to custom lists after they are marked watched.</p>
        </div>
      )}

      {isPending ? <InteractionSkeleton label={pendingLabel} /> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      <div className="pt-4 text-xs">
        {status === "watched" ? (
          <button type="button" disabled={isPending} onClick={() => mutate({ status: "watchlist" }, `Moving ${entryNoun} to Watchlist`)} className="movie-info-focus mb-4 block text-black/50 underline underline-offset-4 hover:text-[#111111] disabled:opacity-50">
            Move to watchlist and clear watched details
          </button>
        ) : null}
        {isConfirmingDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-black/55">Remove this {entryNoun} and its saved review?</span>
            <button type="button" disabled={isPending} onClick={deleteMovie} className="movie-info-focus text-red-700 underline underline-offset-4 disabled:opacity-50">Delete permanently</button>
            <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(false)} className="movie-info-focus text-black/55 underline underline-offset-4">Cancel</button>
          </div>
        ) : (
          <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(true)} className="movie-info-focus text-black/50 underline underline-offset-4 hover:text-[#111111] disabled:opacity-50">Delete {entryNoun}</button>
        )}
      </div>
    </div>
  );
}
