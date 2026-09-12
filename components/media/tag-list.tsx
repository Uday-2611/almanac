export function TagList({ tags }: { tags: string[] }) {
  return <span>{tags.length ? tags.join(" / ") : "No tags yet."}</span>;
}
