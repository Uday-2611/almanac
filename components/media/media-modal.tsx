"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export function MediaModal({ children, label }: { children: ReactNode; label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  const close = () => router.back();

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
        <div className="relative max-h-full w-full max-w-[910px]">
          <button
            type="button"
            onClick={close}
            className="ledger-focus absolute right-4 top-4 z-20 text-sm text-[#686868] hover:text-[#111111] sm:right-6 sm:top-6"
          >
            Close
          </button>
          {children}
        </div>
      </div>
    </dialog>
  );
}
