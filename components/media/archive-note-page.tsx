import Link from "next/link";

type ArchiveNotePageProps = {
  backHref: string;
  backLabel: string;
  creator: string;
  kind: "Book" | "Movie";
  title: string;
  year: string;
};

export function ArchiveNotePage({ backHref, backLabel, creator, kind, title, year }: ArchiveNotePageProps) {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#111111] sm:px-8 sm:py-12">
      <nav className="mx-auto mb-10 flex w-full max-w-[794px] items-center justify-between text-xs text-[#686868]">
        <Link href={backHref} className="ledger-focus hover:text-[#111111]">← {backLabel}</Link>
        <span>Archive note</span>
      </nav>

      <article className="mx-auto min-h-[calc(100dvh-8rem)] w-full max-w-[794px] px-1 sm:px-8">
        <header className="pb-12">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#686868]">Almanac / {kind}</p>
          <h1 className="mt-7 text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-7xl">{title}</h1>
          <p className="mt-4 text-sm text-[#686868]">{creator} <span aria-hidden="true" className="px-1 text-black/25">|</span> {year}</p>
        </header>

        <form>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#686868]">Tags</span>
            <input
              type="text"
              placeholder="Add tags"
              className="mt-3 block w-full bg-transparent py-1 text-sm outline-none transition-colors placeholder:text-black/30 focus-visible:bg-black/[0.025]"
            />
          </label>

          <label className="mt-12 block">
            <span className="sr-only">Archive note</span>
            <textarea
              rows={26}
              placeholder="Write your note…"
              className="block min-h-[610px] w-full resize-y bg-transparent text-base leading-8 outline-none transition-colors placeholder:text-black/30 focus-visible:bg-black/[0.025]"
            />
          </label>
        </form>
      </article>
    </main>
  );
}
