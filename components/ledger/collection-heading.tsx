export function CollectionHeading({ label, count, noun }: { label: string; count: number; noun: string }) {
  return (
    <h2 className="mt-9 pl-3 text-xs font-medium tracking-[-0.01em] text-[#686868] sm:text-sm">
      <span className="text-[#111111]">{label}</span>
      <span aria-hidden="true" className="px-2 text-black/30">/</span>
      {count} {count === 1 ? noun : `${noun}s`}
    </h2>
  );
}
