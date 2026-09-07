export function ListSkeleton({ label }: { label: string }) {
  return (
    <main role="status" aria-label={label} className="min-h-screen px-4 pb-16 pt-[192px] sm:px-5 sm:pt-[195px]">
      <span className="sr-only">{label}</span>
      <div className="w-full max-w-[44rem] space-y-0 pl-3">
        {["w-28", "w-44", "w-36", "w-52", "w-32"].map((width, index) => (
          <div key={index} className="grid grid-cols-[8.5rem_1fr] gap-8 py-4 sm:grid-cols-[10rem_1fr] sm:gap-0">
            <span className="h-3 w-20 animate-pulse bg-[#eeeeee]" />
            <span className={`h-4 ${width} max-w-full animate-pulse bg-[#dedede]`} style={{ animationDelay: `${index * 80}ms` }} />
          </div>
        ))}
      </div>
    </main>
  );
}
