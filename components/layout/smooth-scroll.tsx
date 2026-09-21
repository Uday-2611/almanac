"use client";

import { ReactLenis } from "lenis/react";

export function SmoothScroll() {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        allowNestedScroll: true,
        lerp: 0.15,
        respectReducedMotion: true,
        stopInertiaOnNavigate: true,
      }}
    />
  );
}
