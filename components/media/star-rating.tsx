export function StarRating({ label, value }: { label: string; value: number | null }) {
  if (value === null) return <span aria-label={`${label}: not rated`}>Not rated</span>;

  const fullStars = Math.floor(value);
  const hasHalfStar = value - fullStars >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  return (
    <span aria-label={`${label}: ${value} out of 5`} className="whitespace-nowrap tracking-[0.08em]">
      {"★".repeat(fullStars)}
      {hasHalfStar ? "½" : null}
      <span className="text-[#9a9a9a]">{"☆".repeat(emptyStars)}</span>
    </span>
  );
}
