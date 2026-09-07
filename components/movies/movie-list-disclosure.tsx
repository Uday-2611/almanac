"use client";

import { useState, type ReactNode } from "react";

export function MovieListDisclosure({
  children,
  date,
  id,
  title,
}: {
  children: ReactNode;
  date: string;
  id: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="grid grid-cols-[minmax(8.5rem,10rem)_1fr] items-start gap-8 sm:gap-0 lg:grid-cols-[10rem_1fr_auto]">
        <time className="text-[#686868]">{date}</time>
        <h2 id={`${id}-title`} className="font-medium">{title}</h2>
        <button
          type="button"
          aria-controls={`${id}-contents`}
          aria-expanded={isOpen}
          className="ledger-focus mt-3 inline-flex items-center gap-2 whitespace-nowrap text-left text-[#686868] transition-colors duration-200 hover:text-[#111111] lg:mt-0"
          onClick={() => setIsOpen((current) => !current)}
        >
          View Complete List
          <span
            aria-hidden="true"
            className="inline-flex size-4 items-center justify-center text-lg leading-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            {isOpen ? "−" : "+"}
          </span>
        </button>
      </div>

      <div
        id={`${id}-contents`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
