"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CreateMovieListForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function createList(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/movie-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = response.ok ? null : await response.json().catch(() => null);
      if (!response.ok) return setError(data?.error ?? "The list could not be created.");
      router.replace("/movies?status=lists&view=list");
      router.refresh();
    });
  }

  return (
    <form action={createList} className="mt-8 flex max-w-[32rem] items-end gap-3">
      <label className="min-w-0 flex-1 text-sm">
        <span className="mb-1 block text-[#686868]">List name</span>
        <input name="name" required maxLength={100} className="ledger-focus w-full border-b border-[#111111] bg-transparent py-2" />
      </label>
      <button type="submit" disabled={isPending} className="ledger-focus pb-2 underline underline-offset-4 disabled:opacity-50">{isPending ? "Creating..." : "Create"}</button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
