"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { MediaRail } from "@/components/ledger/media-rail";
import { ResilientArtwork } from "@/components/media/resilient-artwork";

gsap.registerPlugin(useGSAP);

type BookCover = { id: string; title: string; author: string; coverUrl: string | null; tags?: string[] };

function AnimatedBookCover({ book }: { book: BookCover }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const href = `/books/${book.id}`;

  const { contextSafe } = useGSAP(() => {
    const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    gsap.set("[data-book-cover-metadata]", { autoAlpha: hasHover ? 0 : 1, y: hasHover ? 5 : 0 });
    gsap.set("[data-book-cover-artwork]", { scale: 1, transformOrigin: "50% 50%" });
  }, { scope: cardRef });

  const animate = contextSafe((card: HTMLAnchorElement, isActive: boolean) => {
    const artwork = card.querySelector<HTMLElement>("[data-book-cover-artwork]");
    const metadata = card.querySelector<HTMLElement>("[data-book-cover-metadata]");
    const rail = card.closest<HTMLElement>("[data-book-cover-rail]");
    const otherArtwork = rail
      ? Array.from(rail.querySelectorAll<HTMLElement>("[data-book-cover-artwork]")).filter((item) => item !== artwork)
      : [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasHover) return;

    gsap.to(artwork, {
      backgroundColor: isActive ? "#e4e4e0" : "#efefec",
      duration: reducedMotion ? 0 : 0.18,
      ease: "power3.out",
      overwrite: "auto",
      scale: isActive ? 1.06 : 1,
      transformOrigin: "50% 50%",
    });
    gsap.to(otherArtwork, {
      duration: reducedMotion ? 0 : 0.16,
      ease: "power2.out",
      filter: isActive ? "grayscale(0.72)" : "grayscale(0)",
      opacity: isActive ? 0.46 : 1,
      overwrite: "auto",
    });
    gsap.to(metadata, {
      autoAlpha: isActive ? 1 : 0,
      duration: reducedMotion ? 0 : 0.16,
      ease: "power2.out",
      overwrite: "auto",
      y: isActive ? 0 : 5,
    });
  });

  return (
    <li className="w-[160px] flex-none px-1 py-5 sm:w-[208px]">
      <Link
        ref={cardRef}
        href={href}
        className="ledger-focus block"
        aria-label={`${book.title}, by ${book.author}`}
        onBlur={(event) => animate(event.currentTarget, false)}
        onFocus={(event) => {
          router.prefetch(href);
          animate(event.currentTarget, true);
        }}
        onPointerEnter={(event) => {
          router.prefetch(href);
          animate(event.currentTarget, true);
        }}
        onPointerLeave={(event) => animate(event.currentTarget, false)}
      >
        <span data-book-cover-artwork className="relative block aspect-[2/3] w-[152px] overflow-hidden rounded-[4px] bg-[#efefec] will-change-[filter,opacity,transform] sm:w-[200px]">
          <ResilientArtwork src={book.coverUrl?.replace(/-M\.jpg(?=\?|$)/, "-L.jpg") ?? null} alt={`${book.title} book cover`} sizes="(min-width: 640px) 200px, 152px" className="object-contain" title={book.title} fallbackClassName="text-[#111111]" />
        </span>
        <span data-book-cover-metadata className="mt-3 block will-change-[transform,opacity]">
          <span className="block min-h-12 line-clamp-2 break-words text-base font-semibold leading-6 tracking-[-0.018em] text-[#111111] [overflow-wrap:anywhere]">{book.title}</span>
          <span className="mt-0.5 block truncate text-sm text-[#686868]">{book.author}</span>
          {book.tags?.length ? <span className="mt-0.5 block truncate text-xs text-black/45">{book.tags.join(" / ")}</span> : null}
        </span>
      </Link>
    </li>
  );
}

export function BookCoverRail({ books }: { books: BookCover[] }) {
  return (
    <MediaRail kind="book">
      <ul className="mt-[6px] flex w-max gap-1 px-3 pb-3">
        {books.map((book) => <AnimatedBookCover key={book.id} book={book} />)}
      </ul>
    </MediaRail>
  );
}
