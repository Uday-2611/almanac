import Link from "next/link";
import type { ReactNode } from "react";

import { SiteNavigation } from "@/components/layout/site-navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <header className="absolute left-5 top-5 z-20 flex items-start text-sm leading-none sm:text-base">
        <Link
          href="/movies"
          className="uppercase tracking-[-0.035em] outline-none focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:ring-offset-4"
        >
          Almanac
        </Link>
        <SiteNavigation />
      </header>
      {children}
    </div>
  );
}
