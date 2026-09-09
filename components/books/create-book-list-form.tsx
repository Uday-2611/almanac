"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { InteractionSkeleton } from "@/components/states/interaction-skeleton";

export function CreateBookListForm({
  bookId,
  compact = false,
  inverse = false,
  onBookAdded,
}: {
  bookId?: string;
  compact?: boolean;
  inverse?: boolean;
  onBookAdded?: (listId: string) => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function createList(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/book-lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) return setError(data?.error ?? "The list could not be created.");

        if (bookId) {
          const membershipResponse = await fetch(`/api/book-lists/${data.list.id}/books`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookId }),
          });
          const membershipData = membershipResponse.ok ? null : await membershipResponse.json().catch(() => null);
          if (!membershipResponse.ok) return setError(membershipData?.error ?? "The book could not be added to the new list.");
          onBookAdded?.(data.list.id);
        } else {
          router.replace("/books?status=lists&view=list");
        }

        formRef.current?.reset();
        router.refresh();
      } catch {
        setError("The list could not be created. Check your connection and try again.");
      }
    });
  }

  return (
    <form ref={formRef} action={createList} className={`${compact ? "mt-3" : "mt-8"} flex max-w-[32rem] flex-wrap items-end gap-3`}>
      <label className="min-w-0 flex-1 text-sm">
        <span className={`mb-1 block ${inverse ? "text-white/55" : "text-[#686868]"}`}>{bookId ? "New list name" : "List name"}</span>
        <input name="name" required maxLength={100} className={`w-full bg-transparent py-2 ${inverse ? "movie-info-focus border-b border-white/30 text-white" : "ledger-focus border-b border-[#111111]"}`} />
      </label>
      <button type="submit" disabled={isPending} className={`${inverse ? "movie-info-focus text-white" : "ledger-focus"} pb-2 underline underline-offset-4 disabled:opacity-50`}>{isPending ? "Creating..." : "Create"}</button>
      <div className="basis-full">
        {isPending ? <InteractionSkeleton label={bookId ? "Creating list and adding book" : "Creating list"} /> : null}
        {error ? <p role="alert" className={`text-sm ${inverse ? "text-red-300" : "text-red-700"}`}>{error}</p> : null}
      </div>
    </form>
  );
}
