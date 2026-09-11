"use client";

import Image from "next/image";
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
import { MediaInfoSkeleton } from "@/components/states/media-info-skeleton";

export type SearchMediaPreviewData = {
  artwork: string | null;
  creator: string;
  details: string[];
  kind: "movie" | "tv" | "book";
  overview: string | null;
  people: string[];
  title: string;
  year: string;
};

export function SearchMediaPreview({ data, error, label, loading, onClose, open }: {
  data: SearchMediaPreviewData | null;
  error: string;
  label: string;
  loading: boolean;
  onClose: () => void;
  open: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogPortal>
        <DialogBackdrop className="fixed inset-0 z-[60] bg-white/72 backdrop-blur-[14px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogViewport className="fixed inset-0 z-[70] overflow-y-auto p-4 sm:p-6">
          <DialogPopup className="relative mx-auto flex min-h-full w-full max-w-[916px] items-center outline-none transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <DialogTitle className="sr-only">{label}</DialogTitle>
            <DialogDescription className="sr-only">Provider information preview. Close to return to the unchanged search results.</DialogDescription>
            <DialogClose aria-label={`Close ${label}`} className="ledger-focus absolute right-3 top-[calc(50%-257px)] z-20 grid size-9 place-items-center text-[#686868] hover:bg-black/[0.055] hover:text-[#111111] active:scale-95 sm:right-4">
              <X aria-hidden="true" className="size-[18px]" strokeWidth={1.5} />
            </DialogClose>

            {loading ? <MediaInfoSkeleton label={`Loading ${label}`} /> : error ? (
              <div role="alert" className="mx-auto w-full max-w-lg bg-white/80 px-6 py-10 text-center text-sm text-red-700">
                <p>{error}</p>
                <DialogClose className="ledger-focus mt-5 underline underline-offset-4">Return to search</DialogClose>
              </div>
            ) : data ? <PreviewPanel data={data} /> : null}
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}

function PreviewPanel({ data }: { data: SearchMediaPreviewData }) {
  const isScreenTitle = data.kind === "movie" || data.kind === "tv";
  const peopleLabel = isScreenTitle ? "Cast" : "Contributors";

  return (
    <article className="relative grid max-h-[calc(100dvh-2rem)] w-full grid-cols-1 overflow-y-auto gap-1.5 sm:max-h-[calc(100dvh-3rem)] md:h-[546px] md:grid-cols-[364px_1fr] md:overflow-visible">
      <div className="relative aspect-[2/3] w-full bg-[#dededb] md:h-full md:aspect-auto">
        {data.artwork ? <Image src={data.artwork} alt={`${data.title} ${isScreenTitle ? "poster" : "cover"}`} fill sizes="(min-width: 768px) 364px, 100vw" className={isScreenTitle ? "object-cover" : "object-contain"} preload /> : null}
      </div>
      <div className="min-w-0 bg-white/55 p-5 text-[#111111] backdrop-blur-xl sm:p-6 md:h-full md:overflow-y-auto md:px-6 md:py-7">
        <header className="pb-7 pr-11">
          <h2 className="text-[2.7rem] font-semibold leading-[0.94] tracking-[-0.05em] sm:text-[3.25rem]">{data.title}</h2>
          <p className="mt-3 text-sm text-[#686868]">{data.creator} <span aria-hidden="true" className="px-1 text-[#aaa]">|</span> {data.year}</p>
        </header>
        <section className="py-5">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#686868]">Overview</h3>
          <p className="text-sm leading-6">{data.overview || "No overview is available."}</p>
          {data.details.length ? <p className="mt-3 text-xs text-[#686868]">{data.details.join(" / ")}</p> : null}
        </section>
        <section className="py-5">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#686868]">{peopleLabel}</h3>
          <ul className="columns-2 gap-x-6 text-xs leading-6 text-[#686868]">
            {(data.people.length ? data.people : [`${peopleLabel} unavailable.`]).map((person) => <li key={person} className="break-inside-avoid truncate">{person}</li>)}
          </ul>
        </section>
      </div>
    </article>
  );
}
