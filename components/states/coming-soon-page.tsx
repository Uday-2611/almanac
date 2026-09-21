import Link from "next/link";

export function ComingSoonPage({
  section,
  description,
}: {
  section: "Colors" | "Texts";
  description: string;
}) {
  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-32 sm:px-8 sm:pb-10 sm:pt-40 lg:px-12">
      <div className="flex items-baseline justify-between gap-4 border-b border-[#e8e8e8] pb-4 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-[#686868]">
        <span>{section}</span>
        <span>Coming soon</span>
      </div>

      <div className="flex flex-1 flex-col justify-center py-20 sm:py-24">
        <h1 className="text-[clamp(4.5rem,13vw,11rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-[#111111]">
          {section}
        </h1>
        <p className="mt-8 max-w-md text-base leading-7 text-[#555555] sm:mt-10 sm:text-lg">
          {description}
        </p>
      </div>

      <div className="flex justify-end border-t border-[#e8e8e8] pt-3 text-sm">
        <Link href="/movies" className="ledger-focus -mx-1 inline-flex min-h-11 items-center px-1 text-[#111111] hover:text-[#555555]">
          Return to Movies
        </Link>
      </div>
    </main>
  );
}
