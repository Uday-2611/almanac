"use client";

import { useEffect, useRef } from "react";

export function useSmoothHorizontalWheel<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let target = element.scrollLeft;
    let animationFrame: number | null = null;

    const animate = () => {
      const distance = target - element.scrollLeft;

      if (Math.abs(distance) < 0.5) {
        element.scrollLeft = target;
        animationFrame = null;
        return;
      }

      element.scrollLeft += distance * 0.32;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      if (animationFrame === null) target = element.scrollLeft;

      const maximum = element.scrollWidth - element.clientWidth;
      const nextTarget = Math.min(maximum, Math.max(0, target + event.deltaY));
      if (nextTarget === target) return;

      event.preventDefault();
      target = nextTarget;

      if (reducedMotion.matches) {
        element.scrollLeft = target;
        return;
      }

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", handleWheel);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return scrollRef;
}
