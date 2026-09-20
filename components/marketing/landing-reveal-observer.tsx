"use client";

import { useEffect } from "react";

export function LandingRevealObserver() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>("[data-landing-root]");
    if (!page) return;

    const revealItems = Array.from(page.querySelectorAll<HTMLElement>("[data-reveal]"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      revealItems.forEach((item) => item.setAttribute("data-visible", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.14 },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return null;
}
