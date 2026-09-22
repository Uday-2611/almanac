import Link from "next/link";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { ResilientArtwork } from "@/components/media/resilient-artwork";

export type MediaInfo = {
  kind: "Movie" | "TV Show" | "Book";
  title: string;
  creator: string;
  creatorLabel: "Director" | "Created by" | "Author";
  year: string;
  rating: number | null;
  review: string;
  loggedAt: string;
  tags: string[];
  peopleLabel: "Cast" | "Contributors";
  people: string[];
  posterUrl?: string | null;
  overview?: string | null;
  details?: { label: string; value: string }[];
};

export function MediaInfoPanel({ info, actions }: { info: MediaInfo; actions: ReactNode }) {
  const isScreenTitle = info.kind === "Movie" || info.kind === "TV Show";

  return (
    <article aria-label={`${info.title} journal`} className="relative grid max-h-[100dvh] w-full grid-cols-1 gap-1.5 overflow-y-auto rounded-[4px] bg-transparent sm:max-h-[calc(100dvh-3rem)] md:h-[546px] md:grid-cols-[364px_1fr] md:overflow-visible">
      <div className="md:sticky md:top-0 md:h-full md:self-start">
        <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-[4px] md:aspect-auto md:h-full ${isScreenTitle ? "bg-[#252525]" : "bg-[#efefec]"}`}>
          <ResilientArtwork src={info.posterUrl ?? null} alt={`${info.title} ${isScreenTitle ? "poster" : "book cover"}`} sizes="(min-width: 768px) 364px, 100vw" className={isScreenTitle ? "object-cover" : "object-contain"} title={info.title} fallbackClassName={isScreenTitle ? "text-white/80" : "text-[#111111]"} preload />
        </div>
      </div>
      <div className="movie-info-glass min-w-0 p-4 sm:p-6 md:h-full md:overflow-y-auto md:px-6 md:py-7">
        {actions}
      </div>
    </article>
  );
}

export function MediaInfoCard({ info, backHref, actions }: { info: MediaInfo; backHref: string; actions: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-start justify-center overflow-y-auto bg-[#090909] px-0 pb-0 pt-14 sm:h-screen sm:items-center sm:overflow-hidden sm:px-6 sm:pb-6 sm:pt-20">
      <Link href={backHref} aria-label={`Close ${info.title}`} className="absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-[4px] text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 active:scale-95 sm:right-[max(2.5rem,calc((100vw-916px)/2+1.5rem))] sm:top-24 sm:size-9">
        <X aria-hidden="true" className="size-[18px]" strokeWidth={1.5} />
        <span className="sr-only">Close</span>
      </Link>
      <MediaInfoPanel info={info} actions={actions} />
    </main>
  );
}
