"use client";

import { Fragment, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export type AnimatedLedgerItem = {
  id: string;
  href: string;
  date: string;
  group: string;
  title: string;
  creator: string;
  tags?: string[];
};

export function AnimatedLedgerList({
  className = "",
  items,
}: {
  className?: string;
  items: AnimatedLedgerItem[];
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const { contextSafe } = useGSAP({ scope: listRef });

  const animateRows = contextSafe((triggerRow: HTMLElement, isActive: boolean) => {
    const list = triggerRow.closest("ul");
    if (!list) return;

    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-ledger-row]"));
    const activeRow = isActive ? triggerRow : null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.to(rows, {
      duration: reducedMotion ? 0 : 0.11,
      ease: "power1.inOut",
      opacity: (_, row) => (activeRow && row !== activeRow ? 0.36 : 1),
      overwrite: "auto",
    });
  });

  return (
    <ul ref={listRef} className={`text-sm sm:text-base ${className}`}>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {item.group !== items[index - 1]?.group ? (
            <li className="pt-8 first:pt-2" aria-label={`${item.group} entries`}>
              <p className="pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#686868]">{item.group}</p>
            </li>
          ) : null}
          <li>
          <Link
            href={item.href}
            data-ledger-row
            className="ledger-focus grid min-h-[64px] grid-cols-[6.25rem_minmax(0,1fr)] gap-3 py-2.5 will-change-[opacity] sm:min-h-[52px] sm:grid-cols-[10rem_1fr] sm:gap-0"
            onBlur={(event) => animateRows(event.currentTarget, false)}
            onFocus={(event) => {
              router.prefetch(item.href);
              animateRows(event.currentTarget, true);
            }}
            onPointerEnter={(event) => {
              router.prefetch(item.href);
              animateRows(event.currentTarget, true);
            }}
            onPointerLeave={(event) => animateRows(event.currentTarget, false)}
          >
            <time className="pr-1 text-xs leading-5 text-[#686868] sm:pr-0 sm:text-base sm:leading-normal">{item.date}</time>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="break-words [overflow-wrap:anywhere] text-[1.08em] font-semibold tracking-[-0.018em] text-[#111111]">{item.title}</span>
              <span className="break-words text-[#686868]">
                {item.creator}
                {item.tags?.length ? <span className="text-black/45"> <span aria-hidden="true">·</span> {item.tags.join(" / ")}</span> : null}
              </span>
            </span>
          </Link>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
