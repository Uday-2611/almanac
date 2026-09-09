export function InteractionSkeleton({ label = "Saving changes" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-1" aria-live="polite">
      <span className="sr-only">{label}</span>
      <span className="h-2 w-16 animate-pulse bg-[#dedede]" />
      <span className="h-2 w-8 animate-pulse bg-[#eeeeee] [animation-delay:120ms]" />
    </div>
  );
}

export function SearchResultSkeleton({ label = "Searching" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-1">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid min-h-[84px] grid-cols-[45px_minmax(0,1fr)_6rem] items-center gap-2 rounded-[4px] bg-white px-1.5 py-1.5">
          <span className="h-[70px] w-[45px] animate-pulse bg-[#242424]" />
          <span className="space-y-2">
            <span className="block h-3 w-2/3 animate-pulse bg-[#dedede]" />
            <span className="block h-2 w-1/3 animate-pulse bg-[#eeeeee] [animation-delay:120ms]" />
          </span>
          <span className="h-2 w-20 animate-pulse justify-self-end bg-[#eeeeee] [animation-delay:240ms]" />
        </div>
      ))}
    </div>
  );
}
