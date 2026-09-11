"use client";

import { useEffect, useRef } from "react";

export function useSmoothHorizontalWheel<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const maximum = element.scrollWidth - element.clientWidth;
      const nextPosition = Math.min(maximum, Math.max(0, element.scrollLeft + event.deltaY));
      if (nextPosition === element.scrollLeft) return;

      event.preventDefault();
      element.scrollLeft = nextPosition;
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  return scrollRef;
}
