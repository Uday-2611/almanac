"use client";

import Link, { type LinkProps, useLinkStatus } from "next/link";
import type { ReactNode } from "react";

type PendingNavigationLinkProps = {
  active: boolean;
  children: ReactNode;
  href: LinkProps["href"];
  pendingLabel: string;
};

function PendingNavigationState({ children, label }: { children: ReactNode; label: string }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span className={`inline-block transition-opacity duration-150 ${pending ? "opacity-35" : "opacity-100"}`}>
        {children}
      </span>
      <span
        aria-hidden="true"
        className={`ledger-route-progress fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-black/10 transition-opacity duration-150 ${pending ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <span className={`block h-full w-1/3 bg-[#111111] ${pending ? "ledger-route-progress-bar" : ""}`} />
      </span>
      <span aria-live="polite" className="sr-only">{pending ? label : ""}</span>
    </>
  );
}

export function PendingNavigationLink({ active, children, href, pendingLabel }: PendingNavigationLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`ledger-focus ${active ? "text-[#111111]" : "text-[#686868] hover:text-[#111111]"}`}
    >
      <PendingNavigationState label={pendingLabel}>{children}</PendingNavigationState>
    </Link>
  );
}
