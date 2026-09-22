"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ResilientArtwork } from "@/components/media/resilient-artwork";

gsap.registerPlugin(useGSAP);

export function AnimatedMoviePoster({
  creator,
  href,
  posterUrl,
  title,
  mediaType,
  tags,
}: {
  creator: string;
  href: string;
  posterUrl: string | null;
  title: string;
  mediaType: "movie" | "tv";
  tags?: string[];
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();

  const { contextSafe } = useGSAP(() => {
    const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    gsap.set("[data-poster-metadata]", { autoAlpha: hasHover ? 0 : 1, y: hasHover ? 5 : 0 });
    gsap.set("[data-poster-artwork]", { scale: 1, transformOrigin: "50% 50%" });
  }, { scope: cardRef });

  const animate = contextSafe((card: HTMLAnchorElement, isActive: boolean) => {
    const artwork = card.querySelector<HTMLElement>("[data-poster-artwork]");
    const metadata = card.querySelector<HTMLElement>("[data-poster-metadata]");
    const rail = card.closest<HTMLElement>("[data-movie-poster-rail]");
    const otherArtwork = rail
      ? Array.from(rail.querySelectorAll<HTMLElement>("[data-poster-artwork]")).filter((item) => item !== artwork)
      : [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasHover) return;
    const duration = reducedMotion ? 0 : 0.18;

    gsap.to(artwork, {
      backgroundColor: isActive ? "#333333" : "#252525",
      duration,
      ease: "power3.out",
      overwrite: "auto",
      scale: isActive ? 1.06 : 1,
      transformOrigin: "50% 50%",
    });
    gsap.to(otherArtwork, {
      duration: reducedMotion ? 0 : 0.16,
      ease: "power2.out",
      filter: isActive ? "grayscale(0.72)" : "grayscale(0)",
      opacity: isActive ? 0.46 : 1,
      overwrite: "auto",
    });
    gsap.to(metadata, {
      autoAlpha: isActive ? 1 : 0,
      duration: reducedMotion ? 0 : 0.16,
      ease: "power2.out",
      overwrite: "auto",
      y: isActive ? 0 : 5,
    });
  });

  return (
    <li className="w-[160px] flex-none px-1 py-5 sm:w-[208px]">
      <Link
        ref={cardRef}
        href={href}
        className="ledger-focus block"
        aria-label={`${title}, ${mediaType === "tv" ? "created by" : "directed by"} ${creator}`}
        onBlur={(event) => animate(event.currentTarget, false)}
        onFocus={(event) => {
          router.prefetch(href);
          animate(event.currentTarget, true);
        }}
        onPointerEnter={(event) => {
          router.prefetch(href);
          animate(event.currentTarget, true);
        }}
        onPointerLeave={(event) => animate(event.currentTarget, false)}
      >
        <span data-poster-artwork className="relative block aspect-[2/3] w-[152px] overflow-hidden rounded-[4px] bg-[#252525] will-change-[filter,opacity,transform] sm:w-[200px]">
          <ResilientArtwork src={posterUrl} alt="" sizes="(min-width: 640px) 200px, 152px" className="object-cover" title={title} fallbackClassName="text-white/80" />
        </span>
        <span data-poster-metadata className="mt-3 block will-change-[transform,opacity]">
          <span className="block min-h-12 line-clamp-2 break-words text-base font-semibold leading-6 tracking-[-0.018em] text-[#111111] [overflow-wrap:anywhere]">{title}</span>
          <span className="mt-0.5 block truncate text-sm text-[#686868]">{creator}</span>
          {tags?.length ? <span className="mt-0.5 block truncate text-xs text-black/45">{tags.join(" / ")}</span> : null}
        </span>
      </Link>
    </li>
  );
}
