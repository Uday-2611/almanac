import Link from "next/link";
import type { ReactNode } from "react";

import { SiteNavigation } from "@/components/layout/site-navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <header className="absolute left-5 top-5 z-20 flex items-center text-sm leading-none sm:text-base">
        <Link
          href="/movies"
          className="almanac-wordmark ledger-focus px-1 py-0.5 text-lg font-medium tracking-[-0.025em]"
        >
          Almanac
        </Link>
        <SiteNavigation />
      </header>
      {children}
    </div>
  );
}
