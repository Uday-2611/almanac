"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useSmoothHorizontalWheel } from "@/components/ledger/use-smooth-horizontal-wheel";

export function MediaRail({ children, kind }: { children: ReactNode; kind: "movie" | "book" }) {
  const railRef = useSmoothHorizontalWheel<HTMLDivElement>();
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => setEdges({
      start: rail.scrollLeft > 2,
      end: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2,
    });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    if (rail.firstElementChild) observer.observe(rail.firstElementChild);
    rail.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", update);
    };
  }, [railRef]);

  return (
    <div>
      <div className="relative">
        <div
          ref={railRef}
          aria-label={`${kind === "movie" ? "Movies and TV shows" : "Books"}. Scroll horizontally to browse.`}
          data-movie-poster-rail={kind === "movie" ? "" : undefined}
          data-book-cover-rail={kind === "book" ? "" : undefined}
          data-lenis-prevent-wheel
          className="overflow-x-auto overscroll-x-contain"
          role="region"
          tabIndex={0}
        >
          {children}
        </div>
        {edges.start ? <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-white to-transparent" /> : null}
        {edges.end ? <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-9 bg-gradient-to-l from-white to-transparent" /> : null}
      </div>
      {edges.end ? <p className="px-3 text-right text-[11px] tracking-[0.04em] text-[#686868]">Swipe or scroll for more <span aria-hidden="true">→</span></p> : null}
    </div>
  );
}
