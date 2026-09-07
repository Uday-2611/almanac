"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export function AnimatedMoviePoster({
  director,
  href,
  posterUrl,
  title,
}: {
  director: string;
  href: string;
  posterUrl: string | null;
  title: string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const { contextSafe } = useGSAP(() => {
    gsap.set("[data-poster-metadata]", { autoAlpha: 0, y: 5 });
    gsap.set("[data-poster-artwork]", { scale: 1, transformOrigin: "50% 50%" });
  }, { scope: cardRef });

  const animate = contextSafe((card: HTMLAnchorElement, isActive: boolean) => {
    const artwork = card.querySelector<HTMLElement>("[data-poster-artwork]");
    const metadata = card.querySelector<HTMLElement>("[data-poster-metadata]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : 0.42;

    gsap.to(artwork, {
      backgroundColor: isActive ? "#333333" : "#252525",
      duration,
      ease: "power3.out",
      overwrite: "auto",
      scale: isActive ? 1.06 : 1,
      transformOrigin: "50% 50%",
    });
    gsap.to(metadata, {
      autoAlpha: isActive ? 1 : 0,
      duration: reducedMotion ? 0 : 0.32,
      ease: "power2.out",
      overwrite: "auto",
      y: isActive ? 0 : 5,
    });
  });

  return (
    <li className="w-[216px] flex-none px-2 py-5">
      <Link
        ref={cardRef}
        href={href}
        className="ledger-focus block"
        aria-label={`${title}, directed by ${director}`}
        onBlur={(event) => animate(event.currentTarget, false)}
        onFocus={(event) => animate(event.currentTarget, true)}
        onPointerEnter={(event) => animate(event.currentTarget, true)}
        onPointerLeave={(event) => animate(event.currentTarget, false)}
      >
        <span data-poster-artwork className="relative block h-[244px] w-[200px] overflow-hidden bg-[#252525] will-change-transform">
          {posterUrl ? <Image src={posterUrl} alt="" fill sizes="200px" className="object-cover" /> : null}
        </span>
        <span data-poster-metadata className="invisible mt-3 block opacity-0 will-change-[transform,opacity]">
          <span className="block truncate text-sm font-medium text-[#111111]">{title}</span>
          <span className="mt-0.5 block truncate text-sm text-[#686868]">{director}</span>
        </span>
      </Link>
    </li>
  );
}
