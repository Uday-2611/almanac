"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type ArchiveTag = { id: string; name: string };

function byName(left: ArchiveTag, right: ArchiveTag) {
  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

export function ArchiveNoteEditor({
  entryId,
  entryType,
  initialNote,
  initialTags,
  reusableTags,
}: {
  entryId: string;
  entryType: "book" | "movie";
  initialNote: string | null;
  initialTags: ArchiveTag[];
  reusableTags: ArchiveTag[];
}) {
  const router = useRouter();
  const suggestionsId = useId();
  const [note, setNote] = useState(initialNote ?? "");
  const [savedNote, setSavedNote] = useState(initialNote ?? "");
  const [tags, setTags] = useState([...initialTags].sort(byName));
  const [knownTags, setKnownTags] = useState([...reusableTags].sort(byName));
  const [tagName, setTagName] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [removingTagId, setRemovingTagId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const apiRoot = `/api/${entryType === "movie" ? "movies" : "books"}/${entryId}`;
  const isDirty = note !== savedNote;

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function warnBeforeLinkNavigation(event: MouseEvent) {
      if (
        !isDirty ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) return;

      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      if (window.confirm("You have unsaved changes. Leave without saving?")) return;

      event.preventDefault();
      event.stopPropagation();
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    document.addEventListener("click", warnBeforeLinkNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      document.removeEventListener("click", warnBeforeLinkNavigation, true);
    };
  }, [isDirty]);

  const availableTags = useMemo(() => {
    const attachedIds = new Set(tags.map((tag) => tag.id));
    return knownTags.filter((tag) => !attachedIds.has(tag.id));
  }, [knownTags, tags]);

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingNote(true);
    const noteValue = note.trim() ? note : null;

    try {
      const response = await fetch(`${apiRoot}/archive-note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteValue }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "The archive note could not be saved.");
        return;
      }
      const persistedNote = data?.archiveNote ?? "";
      setNote(persistedNote);
      setSavedNote(persistedNote);
      setMessage("Archive note saved.");
      router.refresh();
    } catch {
      setError("The archive note could not be saved. Check your connection and try again.");
    } finally {
      setIsSavingNote(false);
    }
  }

  async function addTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = tagName.trim();
    if (!name) return;

    setError("");
    setMessage("");
    setIsAddingTag(true);
    try {
      const response = await fetch(`${apiRoot}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.tag) {
        setError(data?.error ?? "The tag could not be added.");
        return;
      }

      const tag: ArchiveTag = { id: data.tag.id, name: data.tag.name };
      setTags((current) => current.some((item) => item.id === tag.id) ? current : [...current, tag].sort(byName));
      setKnownTags((current) => current.some((item) => item.id === tag.id) ? current : [...current, tag].sort(byName));
      setTagName("");
      setMessage(`Added ${tag.name}.`);
      router.refresh();
    } catch {
      setError("The tag could not be added. Check your connection and try again.");
    } finally {
      setIsAddingTag(false);
    }
  }

  async function removeTag(tag: ArchiveTag) {
    setError("");
    setMessage("");
    setRemovingTagId(tag.id);
    try {
      const response = await fetch(`${apiRoot}/tags/${tag.id}`, { method: "DELETE" });
      const data = response.ok ? null : await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "The tag could not be removed.");
        return;
      }
      setTags((current) => current.filter((item) => item.id !== tag.id));
      setMessage(`Removed ${tag.name}.`);
      router.refresh();
    } catch {
      setError("The tag could not be removed. Check your connection and try again.");
    } finally {
      setRemovingTagId(null);
    }
  }

  return (
    <div>
      <section aria-labelledby="archive-tags-heading">
        <h2 id="archive-tags-heading" className="text-[10px] uppercase tracking-[0.16em] text-[#686868]">Tags</h2>
        {tags.length ? (
          <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {tags.map((tag, index) => (
              <li key={tag.id} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true" className="mr-1 text-black/25">/</span> : null}
                <span>{tag.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${tag.name}`}
                  disabled={removingTagId === tag.id}
                  onClick={() => removeTag(tag)}
                  className="ledger-focus px-1 text-xs text-black/40 hover:text-[#111111] disabled:opacity-35"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-[#686868]">No tags attached yet.</p>}

        <form onSubmit={addTag} className="mt-5 flex max-w-md items-end gap-4">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Create or reuse a tag</span>
            <input
              type="text"
              list={suggestionsId}
              value={tagName}
              onChange={(event) => setTagName(event.currentTarget.value)}
              maxLength={64}
              placeholder="Create or reuse a tag"
              className="block w-full bg-black/[0.025] px-3 py-2.5 text-sm outline-none placeholder:text-black/30"
            />
            <datalist id={suggestionsId}>
              {availableTags.map((tag) => <option key={tag.id} value={tag.name} />)}
            </datalist>
          </label>
          <button type="submit" disabled={isAddingTag || !tagName.trim()} className="ledger-focus py-2 text-sm font-medium underline decoration-black/25 underline-offset-4 hover:decoration-black disabled:opacity-35">
            {isAddingTag ? "Adding…" : "Add tag"}
          </button>
        </form>
        <p className="mt-2 text-xs leading-5 text-black/45">Existing names are reused across your movies and books.</p>
      </section>

      <form onSubmit={saveNote} className="mt-12">
        <label className="block">
          <span className="sr-only">Archive note</span>
          <textarea
            rows={26}
            maxLength={100_000}
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            placeholder="Write your note…"
            className="block min-h-[610px] w-full resize-y bg-transparent text-base leading-8 outline-none transition-colors placeholder:text-black/30 focus-visible:bg-black/[0.025]"
          />
        </label>
        <div className="mt-5 flex items-center gap-4 text-sm">
          <button type="submit" disabled={isSavingNote || !isDirty} className="ledger-focus font-medium underline decoration-black/25 underline-offset-4 hover:decoration-black disabled:opacity-35">
            {isSavingNote ? "Saving…" : "Save note"}
          </button>
          {isDirty ? <span className="text-[#686868]">Unsaved changes</span> : null}
        </div>
      </form>

      <div aria-live="polite" className="mt-4 min-h-6 text-sm text-[#686868]">{message}</div>
      {error ? <p role="alert" className="mt-1 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
