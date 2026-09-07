import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

import { StarRating } from "@/components/media/star-rating";
import { TagList } from "@/components/media/tag-list";

export type MediaInfo = {
  kind: "Movie" | "Book";
  title: string;
  creator: string;
  creatorLabel: "Director" | "Author";
  year: string;
  rating: number | null;
  review: string;
  loggedAt: string;
  tags: string[];
  peopleLabel: "Cast" | "Contributors";
  people: string[];
  posterUrl?: string | null;
  overview?: string | null;
};

export function MediaInfoPanel({ info, actions }: { info: MediaInfo; actions?: ReactNode }) {
  return (
    <article
      aria-labelledby="media-info-title"
      className="relative grid max-h-[calc(100dvh-2rem)] w-full grid-cols-1 overflow-y-auto border border-[#eaeaea] bg-white sm:max-h-[calc(100dvh-3rem)] md:h-[545px] md:grid-cols-[384px_1fr]"
    >
        <div className="md:sticky md:top-0 md:h-full md:self-start">
          <div className="relative aspect-[384/545] w-full bg-[#020202] md:h-full md:aspect-auto">
            {info.posterUrl ? (
              <Image src={info.posterUrl} alt={`${info.title} ${info.kind.toLowerCase()} poster`} fill sizes="(min-width: 768px) 384px, 100vw" className="object-cover" priority />
            ) : null}
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-6 md:px-[14px] md:py-8">
          <header className="grid grid-cols-1 gap-3 border-b border-[#eaeaea] pb-7 pr-14 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.08em] text-[#686868]">{info.kind}</p>
              <h1 id="media-info-title" className="text-3xl leading-none tracking-[-0.04em] sm:text-4xl">
                {info.title}
              </h1>
              <p className="mt-2 text-lg text-[#686868] sm:text-xl">{info.creator}</p>
            </div>
            <div className="pt-4 text-2xl leading-none sm:pt-1 sm:text-3xl">
              <StarRating label="Your rating" value={info.rating} />
            </div>
          </header>

          <dl className="grid grid-cols-[6rem_1fr] gap-x-5 gap-y-3 border-b border-[#eaeaea] py-6 text-sm sm:grid-cols-[7rem_1fr] sm:text-base">
            <dt className="text-[#686868]">{info.creatorLabel}</dt>
            <dd>{info.creator}</dd>
            <dt className="text-[#686868]">Year</dt>
            <dd>{info.year}</dd>
            <dt className="text-[#686868]">Logged</dt>
            <dd>{info.loggedAt}</dd>
            <dt className="text-[#686868]">Tags</dt>
            <dd><TagList tags={info.tags} /></dd>
          </dl>

          <section aria-labelledby="review-heading" className="border-b border-[#eaeaea] py-6">
            <h2 id="review-heading" className="mb-3 text-sm text-[#686868]">Review</h2>
            <p className="max-w-prose whitespace-pre-line leading-7">{info.review}</p>
          </section>

          {info.overview ? (
            <section aria-labelledby="overview-heading" className="border-b border-[#eaeaea] py-6">
              <h2 id="overview-heading" className="mb-3 text-sm text-[#686868]">Overview</h2>
              <p className="max-w-prose leading-7">{info.overview}</p>
            </section>
          ) : null}

          {actions ? <section className="border-b border-[#eaeaea] py-6">{actions}</section> : null}

          <section aria-labelledby="people-heading" className="py-6">
            <h2 id="people-heading" className="mb-4 text-sm text-[#686868]">{info.peopleLabel}</h2>
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {info.people.map((person) => (
                <li key={person} className="border-t border-[#eaeaea] py-2.5">{person}</li>
              ))}
            </ul>
          </section>
        </div>
    </article>
  );
}

export function MediaInfoCard({ info, backHref, actions }: { info: MediaInfo; backHref: string; actions?: ReactNode }) {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden px-4 pb-4 pt-16 sm:px-6 sm:pb-6 sm:pt-20">
      <Link
        href={backHref}
        className="ledger-focus absolute right-8 top-20 z-10 text-sm text-[#686868] hover:text-[#111111] sm:right-[max(2.5rem,calc((100vw-910px)/2+1.5rem))] sm:top-24"
      >
        Close
      </Link>
      <MediaInfoPanel info={info} actions={actions} />
    </main>
  );
}
