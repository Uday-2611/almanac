"use client";

import type { ReactNode } from "react";

import { MediaRail } from "@/components/ledger/media-rail";

export function MoviePosterRail({ children }: { children: ReactNode }) {
  return <MediaRail kind="movie">{children}</MediaRail>;
}
