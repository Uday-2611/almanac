"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export type AnimatedLedgerItem = {
  id: string;
  href: string;
  date: string;
  title: string;
  creator: string;
};

export function AnimatedLedgerList({
  className = "",
  items,
}: {
  className?: string;
  items: AnimatedLedgerItem[];
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const { contextSafe } = useGSAP({ scope: listRef });

  const animateRows = contextSafe((triggerRow: HTMLElement, isActive: boolean) => {
    const list = triggerRow.closest("ul");
    if (!list) return;

    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-ledger-row]"));
    const activeRow = isActive ? triggerRow : null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.to(rows, {
      duration: reducedMotion ? 0 : 0.38,
      ease: "power3.out",
      opacity: (_, row) => (activeRow && row !== activeRow ? 0.3 : 1),
      overwrite: "auto",
      scale: (_, row) => (row === activeRow ? 1.045 : 1),
      transformOrigin: "left center",
      x: (_, row) => (row === activeRow ? 10 : 0),
    });
  });

  return (
    <ul ref={listRef} className={`text-sm sm:text-base ${className}`}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            data-ledger-row
            className="ledger-focus grid min-h-[52px] grid-cols-[minmax(8.5rem,10rem)_1fr] gap-8 py-2.5 will-change-[transform,opacity] sm:grid-cols-[10rem_1fr] sm:gap-0"
            onBlur={(event) => animateRows(event.currentTarget, false)}
            onFocus={(event) => animateRows(event.currentTarget, true)}
            onPointerEnter={(event) => animateRows(event.currentTarget, true)}
            onPointerLeave={(event) => animateRows(event.currentTarget, false)}
          >
            <time className="text-[#686868]">{item.date}</time>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium text-[#111111]">{item.title}</span>
              <span className="text-[#686868]">{item.creator}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
