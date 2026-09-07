"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ListOption = { id: string; name: string };

export function MovieEntryControls({
  movieId,
  status,
  rating,
  review,
  loggedDate,
  lists,
  selectedListIds,
}: {
  movieId: string;
  status: "watchlist" | "watched";
  rating: number | null;
  review: string | null;
  loggedDate: string | null;
  lists: ListOption[];
  selectedListIds: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function mutate(payload: Record<string, unknown>) {
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = response.ok ? null : await response.json().catch(() => null);
      if (!response.ok) return setError(data?.error ?? "The movie could not be updated.");
      router.refresh();
    });
  }

  function saveReview(formData: FormData) {
    const ratingValue = String(formData.get("rating") ?? "");
    mutate({
      rating: ratingValue ? Number(ratingValue) : null,
      review: String(formData.get("review") ?? "").trim() || null,
      loggedDate: String(formData.get("loggedDate") ?? "") || null,
    });
  }

  function toggleList(listId: string, selected: boolean) {
    setError("");
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
      if (!response.ok) return setError(data?.error ?? "The list could not be updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm text-[#686868]">Collection</p>
        {status === "watchlist" ? (
          <button type="button" disabled={isPending} onClick={() => mutate({ status: "watched" })} className="ledger-focus underline underline-offset-4 disabled:opacity-50">
            Mark as watched
          </button>
        ) : (
          <button type="button" disabled={isPending} onClick={() => mutate({ status: "watchlist" })} className="ledger-focus text-sm text-[#686868] underline underline-offset-4 hover:text-[#111111] disabled:opacity-50">
            Move to watchlist and clear watched details
          </button>
        )}
      </div>

      {status === "watched" ? (
        <>
          <form action={saveReview} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-[#686868]">Rating</span>
                <select name="rating" defaultValue={rating ?? ""} className="ledger-focus block w-full border-b border-[#dedede] bg-white py-2">
                  <option value="">Not rated</option>
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[#686868]">Date watched</span>
                <input name="loggedDate" type="date" defaultValue={loggedDate ?? ""} className="ledger-focus block w-full border-b border-[#dedede] bg-white py-2" />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="text-[#686868]">Review (lightweight markdown)</span>
              <textarea name="review" defaultValue={review ?? ""} rows={5} className="ledger-focus block w-full resize-y border border-[#dedede] bg-white p-3 leading-6" />
            </label>
            <button type="submit" disabled={isPending} className="ledger-focus underline underline-offset-4 disabled:opacity-50">Save watched details</button>
          </form>

          <fieldset disabled={isPending} className="space-y-2">
            <legend className="mb-2 text-sm text-[#686868]">My Lists</legend>
            {lists.length ? lists.map((list) => (
              <label key={list.id} className="flex items-center gap-2 py-1">
                <input type="checkbox" defaultChecked={selectedListIds.includes(list.id)} onChange={(event) => toggleList(list.id, event.currentTarget.checked)} />
                <span>{list.name}</span>
              </label>
            )) : <p className="text-sm text-[#686868]">Create a list from the My Lists view first.</p>}
          </fieldset>
        </>
      ) : (
        <p className="text-sm text-[#686868]">Watchlist movies cannot be added to custom lists. Mark this movie as watched first.</p>
      )}

      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
