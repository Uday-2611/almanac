export function TagList({ tags }: { tags: string[] }) {
  return <span>{tags.join(" / ")}</span>;
}
