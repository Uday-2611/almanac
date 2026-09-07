"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export function MovieAddConfirmation({
  created,
  onDismiss,
  status,
  title,
}: {
  created: boolean;
  onDismiss: () => void;
  status: "watchlist" | "watched";
  title: string;
}) {
  const confirmationRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeline = gsap.timeline({ onComplete: onDismiss });

    timeline
      .fromTo(
        confirmationRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, duration: reducedMotion ? 0 : 0.38, ease: "power3.out", y: 0 },
      )
      .fromTo(
        "[data-confirmation-rule]",
        { scaleX: 0, transformOrigin: "left center" },
        { duration: reducedMotion ? 0 : 0.65, ease: "power2.out", scaleX: 1 },
        0,
      )
      .to(confirmationRef.current, {
        autoAlpha: 0,
        delay: reducedMotion ? 0.8 : 1.35,
        duration: reducedMotion ? 0 : 0.3,
        ease: "power2.in",
        y: -6,
      });
  }, { dependencies: [created, onDismiss, status, title], revertOnUpdate: true, scope: confirmationRef });

  return (
    <div
      ref={confirmationRef}
      aria-atomic="true"
      aria-live="polite"
      className="invisible fixed bottom-6 right-6 z-[80] min-w-56 bg-white px-4 py-3 opacity-0"
      role="status"
    >
      <span data-confirmation-rule aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[#111111]" />
      <span className="block text-xs uppercase tracking-[0.08em] text-[#686868]">
        {created
          ? `Added to ${status === "watchlist" ? "Watchlist" : "Watched"}`
          : "Already in your collection"}
      </span>
      <span className="mt-1 block max-w-64 truncate font-medium text-[#111111]">{title}</span>
    </div>
  );
}
