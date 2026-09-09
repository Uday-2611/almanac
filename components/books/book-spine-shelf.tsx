"use client";

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { useSmoothHorizontalWheel } from "@/components/ledger/use-smooth-horizontal-wheel";

gsap.registerPlugin(useGSAP);

type BookSpine = { id: string; title: string; author: string; coverUrl: string | null };
const spineHeights = [220, 185, 214, 124, 196, 156];
const spineWidths = [34, 31, 37, 29, 35, 32];
const fallbackSpineColors = ["#4d463d", "#3d4850", "#57483f", "#39463f", "#514d3e", "#454047"];

export function BookSpineShelf({ books }: { books: BookSpine[] }) {
  const shelfRef = useSmoothHorizontalWheel<HTMLDivElement>();
  const { contextSafe } = useGSAP({ scope: shelfRef });

  const animateBook = contextSafe((book: HTMLAnchorElement, isActive: boolean) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(book.querySelector<HTMLElement>("[data-book-spine]"), {
      duration: reducedMotion ? 0 : 0.42,
      ease: "power3.out",
      filter: isActive ? "brightness(1.08) saturate(1)" : "brightness(0.84) saturate(0.78)",
      overwrite: "auto",
      scale: isActive ? 1.1 : 1,
      transformOrigin: "50% 50%",
    });
    gsap.to(book.querySelector<HTMLElement>("[data-book-metadata]"), {
      autoAlpha: isActive ? 1 : 0,
      duration: reducedMotion ? 0 : 0.32,
      ease: "power2.out",
      overwrite: "auto",
      y: isActive ? 0 : 5,
    });
  });

  return (
    <div aria-label="Bookshelf. Scroll horizontally to browse." className="absolute inset-x-0 bottom-0 h-[300px] overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-color:#252525_transparent] [scrollbar-width:thin]" ref={shelfRef} role="region" tabIndex={0}>
      <ul className="flex h-full w-max items-end gap-1 pb-4 pl-[7.125rem] pr-24 sm:pr-28">
        {books.map((book, index) => (
          <li key={book.id} className="group/book relative flex-none">
            <Link
              href={`/books/${book.id}`}
              aria-label={`${book.title} by ${book.author}`}
              className="ledger-focus relative block"
              style={{
                height: spineHeights[index % spineHeights.length],
                width: spineWidths[index % spineWidths.length],
              }}
              onBlur={(event) => animateBook(event.currentTarget, false)}
              onFocus={(event) => animateBook(event.currentTarget, true)}
              onPointerEnter={(event) => animateBook(event.currentTarget, true)}
              onPointerLeave={(event) => animateBook(event.currentTarget, false)}
            >
              <span className="pointer-events-none absolute bottom-[calc(100%+0.75rem)] left-1/2 z-10 w-44 -translate-x-1/2 text-center">
                <span data-book-metadata className="invisible block translate-y-1 opacity-0 will-change-[transform,opacity]">
                  <span className="block truncate text-sm font-medium text-[#111111]">{book.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-[#686868]">{book.author}</span>
                </span>
              </span>
              <span
                data-book-spine
                className="absolute inset-0 overflow-hidden brightness-[0.84] saturate-[0.78] will-change-[filter,transform]"
                style={{ backgroundColor: fallbackSpineColors[index % fallbackSpineColors.length] }}
              >
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover object-center"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center px-1 py-3 text-[9px] font-medium uppercase tracking-[0.08em] text-white/85 [writing-mode:vertical-rl]">
                    {book.title}
                  </span>
                )}
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-white/20" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
