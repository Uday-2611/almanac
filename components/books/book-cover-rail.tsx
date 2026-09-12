"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { useSmoothHorizontalWheel } from "@/components/ledger/use-smooth-horizontal-wheel";

gsap.registerPlugin(useGSAP);

type BookCover = { id: string; title: string; author: string; coverUrl: string | null; tags?: string[] };

function AnimatedBookCover({ book }: { book: BookCover }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const href = `/books/${book.id}`;

  const { contextSafe } = useGSAP(() => {
    gsap.set("[data-book-cover-metadata]", { autoAlpha: 0, y: 5 });
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

    gsap.to(artwork, {
      backgroundColor: isActive ? "#333333" : "#252525",
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
    <li className="w-[208px] flex-none px-1 py-5">
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
        <span data-book-cover-artwork className="relative block aspect-[2/3] w-[200px] overflow-hidden rounded-[4px] bg-[#252525] will-change-[filter,opacity,transform]">
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt={`${book.title} book cover`} fill sizes="200px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-5 text-center text-sm font-medium leading-5 text-white/80">
              {book.title}
            </span>
          )}
        </span>
        <span data-book-cover-metadata className="invisible mt-3 block opacity-0 will-change-[transform,opacity]">
          <span className="block truncate text-base font-semibold tracking-[-0.018em] text-[#111111]">{book.title}</span>
          <span className="mt-0.5 block truncate text-sm text-[#686868]">{book.author}</span>
          {book.tags?.length ? <span className="mt-0.5 block truncate text-xs text-black/45">{book.tags.join(" / ")}</span> : null}
        </span>
      </Link>
    </li>
  );
}

export function BookCoverRail({ books }: { books: BookCover[] }) {
  const railRef = useSmoothHorizontalWheel<HTMLDivElement>();

  return (
    <div
      ref={railRef}
      aria-label="Books. Scroll horizontally to browse."
      data-book-cover-rail
      className="overflow-x-auto overscroll-x-contain [scrollbar-color:#252525_transparent] [scrollbar-width:thin]"
      role="region"
      tabIndex={0}
    >
      <ul className="mt-[6px] flex w-max gap-1 px-3 pb-3">
        {books.map((book) => <AnimatedBookCover key={book.id} book={book} />)}
      </ul>
    </div>
  );
}
