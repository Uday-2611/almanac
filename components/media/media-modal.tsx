"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { X } from "lucide-react";

gsap.registerPlugin(useGSAP);

export function MediaModal({ children, label }: { children: ReactNode; label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  useGSAP(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, filter: reducedMotion ? "blur(0px)" : "blur(8px)", scale: reducedMotion ? 1 : 0.985 },
      { autoAlpha: 1, duration: reducedMotion ? 0 : 0.38, ease: "power3.out", filter: "blur(0px)", scale: 1 },
    );
  }, { scope: panelRef });

  const close = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.to(panelRef.current, {
      autoAlpha: 0,
      duration: reducedMotion ? 0 : 0.24,
      ease: "power2.in",
      filter: reducedMotion ? "blur(0px)" : "blur(8px)",
      onComplete: () => router.back(),
      overwrite: true,
      scale: reducedMotion ? 1 : 0.985,
    });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-black/10 p-4 backdrop:bg-white/35 backdrop:backdrop-blur-md sm:p-6"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div
        className="flex h-full items-center justify-center"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div ref={panelRef} className="relative max-h-full w-full max-w-[922px] will-change-[filter,opacity,transform]">
          <button
            type="button"
            onClick={close}
            aria-label="Close movie details"
            className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full text-[#686868] outline-none transition-[background-color,color,transform] duration-200 hover:bg-black/[0.055] hover:text-[#111111] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:ring-offset-4 active:scale-95 sm:right-4 sm:top-4"
          >
            <X aria-hidden="true" className="size-[18px]" strokeWidth={1.5} />
            <span className="sr-only">Close</span>
          </button>
          {children}
        </div>
      </div>
    </dialog>
  );
}
