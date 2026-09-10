export function MediaInfoSkeleton({ label }: { label: string }) {
  return (
    <article
      aria-label={label}
      aria-live="polite"
      className="relative grid max-h-[calc(100dvh-2rem)] w-full grid-cols-1 overflow-hidden gap-1.5 sm:max-h-[calc(100dvh-3rem)] md:h-[546px] md:grid-cols-[364px_1fr]"
      role="status"
    >
      <span className="aspect-[2/3] w-full animate-pulse bg-[#dededb] md:h-full md:aspect-auto" />
      <span className="min-w-0 bg-white/55 p-6 backdrop-blur-xl md:h-full">
        <span className="block h-12 w-4/5 animate-pulse bg-black/10" />
        <span className="mt-3 block h-3 w-2/5 animate-pulse bg-black/[0.07] [animation-delay:100ms]" />
        <span className="mt-12 block h-5 w-32 animate-pulse bg-black/10 [animation-delay:160ms]" />
        <span className="mt-8 block h-3 w-full animate-pulse bg-black/[0.07] [animation-delay:220ms]" />
        <span className="mt-3 block h-3 w-5/6 animate-pulse bg-black/[0.07] [animation-delay:260ms]" />
        <span className="mt-12 block h-24 w-full animate-pulse rounded-[4px] bg-black/[0.06] [animation-delay:320ms]" />
      </span>
      <span className="sr-only">{label}</span>
    </article>
  );
}
