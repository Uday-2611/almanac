import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getMovieForUser } from "@/lib/db/queries/movies";
import { idSchema } from "@/lib/validation";

export default async function MovieArchiveNotePage({ params }: PageProps<"/movies/[movieId]/archive-note">) {
  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const movie = await getMovieForUser(user.id, movieId);
  if (!movie) notFound();

  const year = movie.releaseDate?.slice(0, 4) ?? "Year unknown";

  return (
    <main className="min-h-screen bg-[#e9e8e3] px-4 py-8 text-[#171715] sm:px-8 sm:py-12">
      <nav className="mx-auto mb-5 flex w-full max-w-[794px] items-center justify-between text-xs uppercase tracking-[0.12em]">
        <Link href={`/movies/${movie.id}`} className="ledger-focus text-[#555550] hover:text-[#171715]">← Movie</Link>
        <span className="text-[#777770]">Archive note / Draft</span>
      </nav>

      <article className="mx-auto min-h-[calc(100dvh-6rem)] w-full max-w-[794px] border border-black/15 bg-[#fffdf7] px-6 py-8 sm:min-h-[1123px] sm:px-14 sm:py-12">
        <header className="border-b border-black/20 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777067]">Almanac / Film journal</p>
          <h1 className="mt-8 font-gothic text-5xl leading-[0.9] tracking-[-0.025em] sm:text-7xl">{movie.title}</h1>
          <p className="mt-4 text-sm text-[#4c4943]">{movie.director ?? "Director unavailable"} <span aria-hidden="true" className="px-1 text-[#918b80]">|</span> {year}</p>
        </header>

        <form className="mt-8">
          <label className="block border-b border-black/15 pb-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#777067]">Tags</span>
            <input type="text" defaultValue="" placeholder="memory, performance, sound, desert" className="mt-3 block w-full bg-transparent text-sm outline-none placeholder:text-[#aaa397] focus-visible:ring-1 focus-visible:ring-[#171715]" />
          </label>

          <label className="mt-8 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#777067]">Long-form note</span>
            <textarea
              rows={26}
              placeholder={`Begin with the image, performance, or feeling that stayed with you.\n\nWhat did the film understand? Where did it lose you? Record scenes, lines, sounds, references, and connections worth returning to.`}
              className="mt-4 block min-h-[610px] w-full resize-y bg-[linear-gradient(transparent_31px,rgba(23,23,21,0.1)_32px)] bg-[length:100%_32px] font-serif text-base leading-8 outline-none placeholder:text-[#9c9589] focus-visible:ring-1 focus-visible:ring-[#171715]"
            />
          </label>

          <footer className="mt-10 flex items-end justify-between gap-6 border-t border-black/20 pt-5">
            <p className="max-w-xs text-xs leading-5 text-[#777067]">This is the visual draft of Archive Notes. Saving, markdown, and reusable tags will be connected in a later milestone.</p>
            <button type="button" disabled className="border border-black/25 px-4 py-3 text-xs uppercase tracking-[0.12em] text-[#777067] disabled:cursor-not-allowed">Save note</button>
          </footer>
        </form>
      </article>
    </main>
  );
}
