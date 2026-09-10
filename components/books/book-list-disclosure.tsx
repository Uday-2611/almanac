"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { InteractionSkeleton } from "@/components/states/interaction-skeleton";

export function BookListDisclosure({ children, date, id, title }: {
  children: ReactNode;
  date: string;
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function renameList(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/book-lists/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: String(formData.get("name") ?? "").trim() }),
        });
        const data = response.ok ? null : await response.json().catch(() => null);
        if (!response.ok) return setError(data?.error ?? "The list could not be renamed.");
        setIsEditing(false);
        router.refresh();
      } catch {
        setError("The list could not be renamed. Check your connection and try again.");
      }
    });
  }

  function deleteList() {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/book-lists/${id}`, { method: "DELETE" });
        const data = response.ok ? null : await response.json().catch(() => null);
        if (!response.ok) return setError(data?.error ?? "The list could not be deleted.");
        router.refresh();
      } catch {
        setError("The list could not be deleted. Check your connection and try again.");
      }
    });
  }

  return (
    <section aria-label={title}>
      <div className="grid grid-cols-[minmax(8.5rem,10rem)_1fr] items-start gap-8 sm:gap-0 lg:grid-cols-[10rem_1fr_auto]">
        <time className="text-[#686868]">{date}</time>
        {isEditing ? (
          <form action={renameList} className="flex min-w-0 items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="sr-only">List name</span>
              <input name="name" required maxLength={100} defaultValue={title} autoFocus className="ledger-focus w-full border-b border-[#111111] bg-transparent py-1 font-medium" />
            </label>
            <button type="submit" disabled={isPending} className="ledger-focus text-sm underline underline-offset-4 disabled:opacity-50">Save</button>
            <button type="button" disabled={isPending} onClick={() => setIsEditing(false)} className="ledger-focus text-sm text-[#686868] underline underline-offset-4 disabled:opacity-50">Cancel</button>
          </form>
        ) : <h2 id={`${id}-title`} className="font-medium">{title}</h2>}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#686868] lg:mt-0 lg:justify-end">
          {!isEditing && !isConfirmingDelete ? (
            <>
              <button type="button" disabled={isPending} onClick={() => setIsEditing(true)} className="ledger-focus transition-colors duration-150 hover:text-[#111111] disabled:opacity-50">Rename</button>
              <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(true)} className="ledger-focus transition-colors duration-150 hover:text-red-700 disabled:opacity-50">Delete</button>
            </>
          ) : null}
          {isConfirmingDelete ? (
            <>
              <span>Delete list?</span>
              <button type="button" disabled={isPending} onClick={deleteList} className="ledger-focus text-red-700 underline underline-offset-4 disabled:opacity-50">Delete permanently</button>
              <button type="button" disabled={isPending} onClick={() => setIsConfirmingDelete(false)} className="ledger-focus underline underline-offset-4 disabled:opacity-50">Cancel</button>
            </>
          ) : null}
          <button
            type="button"
            aria-controls={`${id}-contents`}
            aria-expanded={isOpen}
            aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
            disabled={isPending}
            className="ledger-focus inline-flex size-7 items-center justify-center text-[1.45rem] leading-none transition-[color,transform] duration-200 hover:text-[#111111] active:scale-90 disabled:opacity-50"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
          </button>
        </div>
      </div>

      {isPending ? <div className="ml-0 mt-3 sm:ml-[10rem]"><InteractionSkeleton label={isConfirmingDelete ? "Deleting book list" : "Renaming book list"} /></div> : null}
      {error ? <p role="alert" className="ml-0 mt-3 text-sm text-red-700 sm:ml-[10rem]">{error}</p> : null}

      <div id={`${id}-contents`} className={`grid transition-[grid-template-rows,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
