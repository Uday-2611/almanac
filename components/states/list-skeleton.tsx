export function ListSkeleton({ label }: { label: string }) {
  return <p aria-live="polite">{label}...</p>;
}
