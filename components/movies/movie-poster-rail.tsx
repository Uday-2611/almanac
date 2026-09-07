"use client";

import type { ReactNode } from "react";

import { useSmoothHorizontalWheel } from "@/components/ledger/use-smooth-horizontal-wheel";

export function MoviePosterRail({ children }: { children: ReactNode }) {
  const railRef = useSmoothHorizontalWheel<HTMLDivElement>();

  return (
    <div
      ref={railRef}
      aria-label="Movies. Scroll horizontally to browse."
      data-movie-poster-rail
      className="overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-color:#252525_transparent] [scrollbar-width:thin]"
      role="region"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
