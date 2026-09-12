import Link from "next/link";

export type TagFilterOption = { id: string; name: string };

export function TagFilter({
  activeTagId,
  pathname,
  query,
  tags,
}: {
  activeTagId?: string;
  pathname: "/books" | "/movies";
  query: Record<string, string>;
  tags: TagFilterOption[];
}) {
  if (!tags.length) return null;

  function href(tagId?: string) {
    return { pathname, query: tagId ? { ...query, tag: tagId } : query };
  }

  return (
    <nav aria-label="Filter by tag" className="mt-5 flex max-w-full items-center gap-2 overflow-x-auto pb-1 text-xs text-[#686868] [scrollbar-width:thin] sm:text-sm">
      <span className="flex-none text-black/45">Tags</span>
      <Link href={href()} aria-current={!activeTagId ? "page" : undefined} className={`ledger-focus flex-none px-1 ${!activeTagId ? "font-semibold text-[#111111]" : "hover:text-[#111111]"}`}>
        All
      </Link>
      {tags.map((tag) => (
        <span key={tag.id} className="flex flex-none items-center">
          <span aria-hidden="true" className="text-black/25">/</span>
          <Link href={href(tag.id)} aria-current={activeTagId === tag.id ? "page" : undefined} className={`ledger-focus px-1 ${activeTagId === tag.id ? "font-semibold text-[#111111]" : "hover:text-[#111111]"}`}>
            {tag.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}
