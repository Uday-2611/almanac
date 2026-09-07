export function InteractionSkeleton({ label = "Saving changes" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-1" aria-live="polite">
      <span className="sr-only">{label}</span>
      <span className="h-2 w-16 animate-pulse bg-[#dedede]" />
      <span className="h-2 w-8 animate-pulse bg-[#eeeeee] [animation-delay:120ms]" />
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div role="status" aria-label="Searching movies" className="divide-y divide-[#eeeeee]">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid min-h-[78px] grid-cols-[42px_minmax(0,1fr)_4rem] items-center gap-3 px-3 py-2.5 sm:grid-cols-[46px_minmax(0,1fr)_4rem] sm:px-4">
          <span className="h-[52px] w-[38px] animate-pulse bg-[#e7e7e7]" />
          <span className="space-y-2">
            <span className="block h-3 w-2/3 animate-pulse bg-[#dedede]" />
            <span className="block h-2 w-1/3 animate-pulse bg-[#eeeeee] [animation-delay:120ms]" />
          </span>
          <span className="h-2 w-10 animate-pulse justify-self-end bg-[#eeeeee] [animation-delay:240ms]" />
        </div>
      ))}
    </div>
  );
}
