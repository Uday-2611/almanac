"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogViewport,
} from "@/components/ui/dialog";

export type MovieWatchedDetails = {
  loggedDate: string | null;
  rating: number | null;
  review: string | null;
};

export function MovieWatchedDialog({
  fromWatchlist,
  onClose,
  onSave,
  title,
}: {
  fromWatchlist: boolean;
  onClose: () => void;
  onSave: (details: MovieWatchedDetails) => Promise<string | null>;
  title: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [rating, setRating] = useState<number | null>(null);
  const [loggedDate, setLoggedDate] = useState(today);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    const saveError = await onSave({
      loggedDate: loggedDate || null,
      rating,
      review: review.trim() || null,
    });
    setIsSaving(false);

    if (saveError) setError(saveError);
    else onClose();
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogPortal>
        <DialogBackdrop className="fixed inset-0 z-[80] bg-white/72 backdrop-blur-[14px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogViewport className="fixed inset-0 z-[90] overflow-y-auto p-2 sm:p-6">
          <DialogPopup className="relative mx-auto my-auto w-full max-w-[42rem] rounded-[4px] bg-white px-5 py-6 text-[#111111] outline-none transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 sm:px-8 sm:py-8">
            <DialogClose aria-label="Close watched review" className="ledger-focus absolute right-2 top-2 grid size-11 place-items-center text-[#686868] hover:bg-black/[0.055] hover:text-[#111111] active:scale-95 sm:size-9">
              <X aria-hidden="true" className="size-[18px]" strokeWidth={1.5} />
            </DialogClose>

            <header className="pr-12">
              <p className="text-[11px] uppercase tracking-[0.12em] text-black/45">Add to Watched</p>
              <DialogTitle className="mt-2 break-words text-[clamp(2rem,9vw,3rem)] font-semibold leading-[0.96] tracking-[-0.045em]">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-lg text-sm leading-6 text-black/55">
                {fromWatchlist
                  ? "Add the details you want to keep. Saving moves this title from Watchlist to Watched."
                  : "Add the details you want to keep. Saving places this title directly in Watched."}
              </DialogDescription>
            </header>

            <form className="mt-7" onSubmit={submit}>
              <fieldset disabled={isSaving}>
                <legend className="text-[11px] uppercase tracking-[0.12em] text-black/45">Rating</legend>
                <div className="mt-2 flex items-center gap-1 text-[1.7rem] leading-none" aria-label={`Rating: ${rating ?? "not rated"}`}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Rate ${value} out of 5`}
                      aria-pressed={rating === value}
                      onClick={() => setRating((current) => current === value ? null : value)}
                      className={`movie-info-focus grid size-11 place-items-center transition-[color,transform] duration-150 active:scale-90 sm:size-10 ${value <= (rating ?? 0) ? "text-[#111111]" : "text-black/20 hover:text-black/50"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <label className="mt-6 block">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-black/45">Date watched</span>
                  <input
                    type="date"
                    max={today}
                    value={loggedDate}
                    onChange={(event) => setLoggedDate(event.currentTarget.value)}
                    className="movie-info-focus mt-2 block min-h-11 w-full bg-black/[0.045] px-3 font-mono text-sm text-[#111111] [color-scheme:light] sm:w-auto"
                  />
                </label>

                <label className="mt-6 block">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-black/45">Your review</span>
                  <textarea
                    value={review}
                    onChange={(event) => setReview(event.currentTarget.value)}
                    rows={7}
                    maxLength={20_000}
                    placeholder="Write what stayed with you…"
                    className="movie-info-focus mt-2 block w-full resize-y bg-black/[0.045] p-3 text-sm leading-6 text-[#111111] placeholder:text-black/35"
                  />
                </label>
              </fieldset>

              {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}

              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm">
                <button type="submit" disabled={isSaving} className="ledger-focus font-medium underline decoration-black/30 underline-offset-4 hover:decoration-black disabled:opacity-50">
                  {isSaving ? "Saving to Watched…" : "Save to Watched"}
                </button>
                <DialogClose disabled={isSaving} className="ledger-focus text-black/55 underline decoration-black/20 underline-offset-4 hover:text-[#111111] disabled:opacity-50">
                  Cancel
                </DialogClose>
              </div>
            </form>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}
