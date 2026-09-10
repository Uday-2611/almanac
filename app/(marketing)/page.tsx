import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

const ledgerPreview = [
  { date: "Sep 2026", title: "A film worth returning to", creator: "Your note, rating, and watched date" },
  { date: "Aug 2026", title: "The book that stayed", creator: "Your review, tags, and reading history" },
  { date: "Whenever", title: "Nothing public. Nothing performative.", creator: "Just your private record" },
] as const;

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/movies");

  return (
    <main className="flex min-h-screen flex-col bg-white px-5 py-5 text-[#111111] sm:px-10 sm:py-8 lg:px-16">
      <header className="flex items-center justify-between">
        <p className="almanac-wordmark text-lg font-medium tracking-[-0.025em]">Almanac</p>
        <Link href="/login" className="ledger-focus px-2 py-1 text-sm text-[#686868] hover:bg-black/[0.04] hover:text-[#111111] active:scale-[0.98]">
          Sign in <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="grid flex-1 content-center gap-12 py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.7fr)] lg:items-end lg:gap-24">
        <div className="max-w-3xl">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.14em] text-[#686868]">A private movie and book ledger</p>
          <h1 className="max-w-[14ch] text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
            Keep what stayed with you.
          </h1>
        </div>

        <div className="max-w-md lg:pb-2">
          <p className="text-base leading-7 text-[#4f4f4f] sm:text-lg sm:leading-8">
            Log the films you watch and the books you read without feeds, followers, or noise. A calm place for the details you want to remember.
          </p>
          <Link href="/login" className="ledger-focus mt-8 inline-flex items-center gap-2 px-2 py-1.5 font-medium hover:bg-black/[0.04] active:scale-[0.98]">
            Open your ledger <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <ol aria-label="What Almanac keeps" className="border-t border-[#dedede]">
        {ledgerPreview.map((item) => (
          <li key={item.title} className="grid gap-1 border-b border-[#ededed] py-4 text-sm sm:grid-cols-[10rem_1fr] sm:gap-0">
            <span className="text-[#686868]">{item.date}</span>
            <span>
              <strong className="block font-semibold tracking-[-0.018em]">{item.title}</strong>
              <span className="mt-0.5 block text-[#686868]">{item.creator}</span>
            </span>
          </li>
        ))}
      </ol>
    </main>
  );
}
