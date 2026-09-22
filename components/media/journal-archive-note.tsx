import { TagList } from "@/components/media/tag-list";

export function JournalArchiveNote({ href, tags }: { href: string; tags: string[] }) {
  return (
    <section aria-labelledby="archive-note-heading" className="py-5">
      <h2 id="archive-note-heading" className="mb-2 text-[11px] uppercase tracking-[0.12em] text-black/45">Archive Note</h2>
      <p className="mb-4 text-sm text-black/70"><TagList tags={tags} /></p>
      <a href={href} className="group movie-info-focus inline-flex items-center rounded-[4px] bg-black/[0.07] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-[background-color,transform] duration-200 hover:bg-black/[0.12] active:scale-[0.98]">
        Open archive note
        <span aria-hidden="true" className="ml-8 transition-transform duration-200 group-hover:translate-x-1">→</span>
      </a>
      <p className="mt-2 max-w-sm text-xs leading-5 text-black/45">Write a longer note and manage reusable tags.</p>
    </section>
  );
}
