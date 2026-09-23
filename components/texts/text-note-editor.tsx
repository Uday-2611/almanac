"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ReviewMarkdown } from "@/components/media/review-markdown";
import {
  Dialog, DialogBackdrop, DialogClose, DialogDescription, DialogPopup,
  DialogPortal, DialogTitle, DialogViewport,
} from "@/components/ui/dialog";
import { responseErrorMessage } from "@/lib/http/client-errors";
import {
  canClearLocalTextDraft,
  nextTextRevision,
  parseTextDraft,
  shouldOfferTextDraftRecovery,
  textDraftFingerprint,
  textDraftStorageKey,
  type TextDraftSnapshot,
} from "@/lib/texts/autosave";

type Folder = { id: string; name: string };
type InitialNote = {
  id: string;
  title: string | null;
  body: string;
  journalDate: string;
  folderIds: string[];
  clientRevision: number;
  createdAt: string;
  updatedAt: string;
} | null;

type SaveState = "idle" | "saving" | "saved" | "error";

const auditDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function TextNoteEditor({ folders, initialNote, isNew, noteId, returnTo, userId, userName }: {
  folders: Folder[];
  initialNote: InitialNote;
  isNew: boolean;
  noteId: string;
  returnTo: string;
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const initialDraft: TextDraftSnapshot = {
    noteId,
    title: initialNote?.title ?? "",
    body: initialNote?.body ?? "",
    journalDate: initialNote?.journalDate ?? today,
    folderIds: initialNote?.folderIds ?? [],
    revision: initialNote?.clientRevision ?? 0,
    changedAt: initialNote?.updatedAt ?? new Date().toISOString(),
    confirmedUpdatedAt: initialNote?.updatedAt ?? null,
  };
  const [draft, setDraft] = useState(initialDraft);
  const [recoveryDraft, setRecoveryDraft] = useState<TextDraftSnapshot | null>(null);
  const [saveState, setSaveState] = useState<SaveState>(initialNote ? "saved" : "idle");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [folderDraftIds, setFolderDraftIds] = useState<string[]>(initialDraft.folderIds);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [canLeaveWithDraft, setCanLeaveWithDraft] = useState(false);
  const draftRef = useRef(initialDraft);
  const confirmedRevisionRef = useRef(initialNote?.clientRevision ?? -1);
  const confirmedFingerprintRef = useRef(initialNote ? textDraftFingerprint(initialDraft) : "");
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = textDraftStorageKey(userId, noteId);

  const hasUnsavedChanges = useCallback(() => (
    textDraftFingerprint(draftRef.current) !== confirmedFingerprintRef.current
  ), []);

  const drainSaves = useCallback(async () => {
    if (savePromiseRef.current) return savePromiseRef.current;
    const promise = (async () => {
      while (hasUnsavedChanges()) {
        const snapshot = draftRef.current;
        setSaveState("saving");
        setError("");
        try {
          const response = await fetch(`/api/texts/notes/${noteId}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title: snapshot.title,
              body: snapshot.body,
              journalDate: snapshot.journalDate,
              folderIds: snapshot.folderIds,
              revision: snapshot.revision,
            }),
          });
          if (!response.ok) {
            setError(await responseErrorMessage(response, "This note could not be saved. Retry when your connection is available."));
            setSaveState("error");
            return false;
          }
          const payload = await response.json().catch(() => null) as { note?: { clientRevision?: number; updatedAt?: string } } | null;
          if (!payload?.note || typeof payload.note.clientRevision !== "number") {
            setError("The note may not have been saved because the server response was incomplete. Retry before leaving.");
            setSaveState("error");
            return false;
          }
          confirmedRevisionRef.current = payload.note.clientRevision;
          confirmedFingerprintRef.current = textDraftFingerprint(snapshot);
          if (canClearLocalTextDraft(snapshot, draftRef.current, true)) {
            localStorage.removeItem(storageKey);
            setSaveState("saved");
          }
        } catch {
          setError("This note is still on this device, but it could not reach Almanac. Check your connection and retry.");
          setSaveState("error");
          return false;
        }
      }
      return true;
    })().finally(() => { savePromiseRef.current = null; });
    savePromiseRef.current = promise;
    return promise;
  }, [hasUnsavedChanges, noteId, storageKey]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void drainSaves(); }, 700);
  }, [drainSaves]);

  const applyChange = useCallback((change: Partial<Pick<TextDraftSnapshot, "title" | "body" | "journalDate" | "folderIds">>) => {
    const current = draftRef.current;
    const next: TextDraftSnapshot = {
      ...current,
      ...change,
      revision: nextTextRevision(current.revision, confirmedRevisionRef.current),
      changedAt: new Date().toISOString(),
    };
    draftRef.current = next;
    setDraft(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaveState("saving");
    setError("");
    scheduleSave();
  }, [scheduleSave, storageKey]);

  useEffect(() => {
    const localDraft = parseTextDraft(localStorage.getItem(storageKey));
    if (!shouldOfferTextDraftRecovery(localDraft, initialNote ? {
      id: initialNote.id,
      clientRevision: initialNote.clientRevision,
      updatedAt: initialNote.updatedAt,
    } : null)) {
      if (localDraft) localStorage.removeItem(storageKey);
      return;
    }
    if (isNew && !initialNote && localDraft) {
      draftRef.current = localDraft;
      window.history.replaceState(window.history.state, "", window.location.href.replace(/([?&])new=1(&|$)/, "$1").replace(/[?&]$/, ""));
      const timer = window.setTimeout(() => setDraft(localDraft), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setRecoveryDraft(localDraft), 0);
    return () => window.clearTimeout(timer);
  }, [initialNote, isNew, storageKey]);

  useEffect(() => {
    function bestEffortFlush() {
      if (!hasUnsavedChanges()) return;
      const snapshot = draftRef.current;
      void fetch(`/api/texts/notes/${noteId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: snapshot.title,
          body: snapshot.body,
          journalDate: snapshot.journalDate,
          folderIds: snapshot.folderIds,
          revision: snapshot.revision,
        }),
        keepalive: true,
      });
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") bestEffortFlush();
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
    }
    window.addEventListener("pagehide", bestEffortFlush);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", bestEffortFlush);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasUnsavedChanges, noteId]);

  function recoverDraft() {
    if (!recoveryDraft) return;
    draftRef.current = recoveryDraft;
    setDraft(recoveryDraft);
    setRecoveryDraft(null);
    setSaveState("saving");
    scheduleSave();
  }

  function discardRecovery() {
    localStorage.removeItem(storageKey);
    setRecoveryDraft(null);
  }

  async function closeEditor() {
    if (timerRef.current) clearTimeout(timerRef.current);
    const saved = await drainSaves();
    if (!saved) {
      setCanLeaveWithDraft(true);
      return;
    }
    router.push(returnTo);
  }

  async function deleteNote() {
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/texts/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) {
        setError(await responseErrorMessage(response, "The note could not be deleted."));
        return;
      }
      localStorage.removeItem(storageKey);
      router.push(returnTo);
    } catch {
      setError("The note could not be deleted. Check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const statusText = saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved" : "Draft";

  function openFolderPicker() {
    setFolderDraftIds(draftRef.current.folderIds);
    setFolderPickerOpen(true);
  }

  function confirmFolders() {
    const current = [...draftRef.current.folderIds].sort().join("|");
    const next = [...folderDraftIds].sort().join("|");
    if (current !== next) applyChange({ folderIds: folderDraftIds });
    setFolderPickerOpen(false);
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-20 text-[#111111] sm:px-8 sm:pb-24 sm:pt-24">
      <div className="mx-auto w-full max-w-[840px]">
        <nav className="flex items-center justify-between gap-4 text-xs text-[#686868]">
          <button type="button" onClick={closeEditor} className="ledger-focus min-h-11 py-2 text-left hover:text-[#111111] sm:min-h-0">← Texts</button>
          <div aria-live="polite" className="flex items-center gap-3">
            <span className={saveState === "error" ? "text-red-700" : ""}>{statusText}</span>
            {saveState === "error" ? <button type="button" onClick={() => void drainSaves()} className="ledger-focus min-h-11 py-2 underline decoration-black/25 underline-offset-4 sm:min-h-0">Retry</button> : null}
          </div>
        </nav>

        {recoveryDraft ? (
          <section className="mt-8 border-y border-black/10 py-5 text-sm" aria-labelledby="draft-recovery-title">
            <h2 id="draft-recovery-title" className="font-semibold">A newer draft is on this device.</h2>
            <p className="mt-1 leading-6 text-[#686868]">Recover it to continue writing, or keep the version saved in Almanac.</p>
            <div className="mt-3 flex flex-wrap gap-5">
              <button type="button" onClick={recoverDraft} className="ledger-focus min-h-11 py-2 font-medium underline decoration-black/25 underline-offset-4 sm:min-h-0">Recover draft</button>
              <button type="button" onClick={discardRecovery} className="ledger-focus min-h-11 py-2 text-[#686868] hover:text-red-700 sm:min-h-0">Discard local draft</button>
            </div>
          </section>
        ) : null}

        <article className="mt-12 sm:mt-16">
          <label className="block">
            <span className="sr-only">Note title</span>
            <textarea rows={1} value={draft.title} onChange={(event) => applyChange({ title: event.currentTarget.value })} maxLength={300} placeholder="Untitled note" className="w-full resize-none overflow-hidden bg-transparent text-[clamp(2.4rem,9vw,5rem)] font-semibold leading-[0.94] tracking-[-0.055em] outline-none [field-sizing:content] placeholder:text-black/22" />
          </label>

          <div className="mt-8 flex flex-col gap-6 border-y border-black/10 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3">
              <span className="text-[#686868]">Journal date</span>
              <input type="date" value={draft.journalDate} min="1000-01-01" max="9999-12-31" onChange={(event) => applyChange({ journalDate: event.currentTarget.value })} className="ledger-focus min-h-11 bg-transparent px-2 sm:min-h-0" />
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setMode("write")} className={`ledger-focus min-h-11 px-1 py-2 sm:min-h-0 ${mode === "write" ? "font-semibold" : "text-[#686868]"}`}>Write</button>
              <span aria-hidden="true" className="text-black/25">/</span>
              <button type="button" onClick={() => setMode("preview")} className={`ledger-focus min-h-11 px-1 py-2 sm:min-h-0 ${mode === "preview" ? "font-semibold" : "text-[#686868]"}`}>Preview</button>
            </div>
          </div>

          {mode === "write" ? (
            <label className="mt-10 block">
              <span className="sr-only">Note body</span>
              <textarea autoFocus={!initialNote} rows={24} maxLength={100_000} value={draft.body} onChange={(event) => applyChange({ body: event.currentTarget.value })} placeholder="Write your note…" className="min-h-[52dvh] w-full resize-y bg-transparent text-base leading-8 outline-none placeholder:text-black/25 focus-visible:bg-black/[0.02]" />
            </label>
          ) : (
            <div className="mt-10 min-h-[52dvh] text-base">
              {draft.body ? <ReviewMarkdown source={draft.body} /> : <p className="text-[#686868]">Nothing to preview yet.</p>}
            </div>
          )}

          {mode === "write" ? (
            <section className="mt-12 border-t border-black/10 pt-6" aria-labelledby="note-folders-heading">
              <h2 id="note-folders-heading" className="text-[10px] uppercase tracking-[0.16em] text-[#686868]">Folders</h2>
              <p className="mt-3 text-sm text-[#686868]">{draft.folderIds.length ? folders.filter((folder) => draft.folderIds.includes(folder.id)).map((folder) => folder.name).join(" / ") : "This note is unfiled."}</p>
              <button type="button" onClick={openFolderPicker} className="ledger-focus mt-3 min-h-11 py-2 text-sm font-medium underline decoration-black/25 underline-offset-4 sm:min-h-0">Add to a folder</button>
            </section>
          ) : null}

          <footer className="mt-14 border-t border-black/10 pt-6 text-sm text-[#686868]">
            <p>Written by {userName}</p>
            {initialNote ? <p className="mt-1 text-xs">Created {auditDateFormatter.format(new Date(initialNote.createdAt))} <span aria-hidden="true" className="px-1 text-black/25">/</span> Updated {auditDateFormatter.format(new Date(initialNote.updatedAt))}</p> : null}
            {mode === "write" && confirmingDelete ? (
              <div className="mt-7 border-y border-black/10 py-4">
                <p className="text-[#111111]">Delete this note? This cannot be undone.</p>
                <div className="mt-2 flex gap-5"><button type="button" onClick={() => setConfirmingDelete(false)} className="ledger-focus min-h-11 py-2 sm:min-h-0">Keep note</button><button type="button" disabled={isDeleting} onClick={deleteNote} className="ledger-focus min-h-11 py-2 text-red-700 disabled:opacity-35 sm:min-h-0">{isDeleting ? "Deleting…" : "Delete permanently"}</button></div>
              </div>
            ) : mode === "write" ? <button type="button" onClick={() => setConfirmingDelete(true)} className="ledger-focus mt-8 min-h-11 py-2 text-sm hover:text-red-700 sm:min-h-0">Delete note</button> : null}
          </footer>
          {error ? <p role="alert" className="mt-4 text-sm leading-6 text-red-700">{error}</p> : null}
          {canLeaveWithDraft ? <button type="button" onClick={() => router.push(returnTo)} className="ledger-focus mt-3 min-h-11 py-2 text-sm underline decoration-black/25 underline-offset-4 sm:min-h-0">Leave with local draft</button> : null}
        </article>
      </div>

      <Dialog open={folderPickerOpen} onOpenChange={setFolderPickerOpen}>
        <DialogPortal>
          <DialogBackdrop className="fixed inset-0 z-[70] bg-white/70 backdrop-blur-[12px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <DialogViewport data-lenis-prevent className="fixed inset-0 z-[80] flex overflow-y-auto p-3 sm:p-8">
            <DialogPopup className="relative m-auto w-full max-w-md rounded-[4px] border border-black/10 bg-white px-5 py-6 outline-none transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 sm:px-7">
              <DialogTitle className="text-lg font-semibold tracking-[-0.025em]">Add to a folder</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-[#686868]">Choose one or more folders for this note.</DialogDescription>
              {folders.length ? <fieldset className="mt-5 max-h-72 overflow-y-auto border-y border-black/10"><legend className="sr-only">Folders</legend>{folders.map((folder) => <label key={folder.id} className="ledger-focus flex min-h-12 cursor-pointer items-center gap-3 border-b border-black/10 px-1 py-2 text-sm last:border-b-0"><input type="checkbox" className="size-4 accent-black" checked={folderDraftIds.includes(folder.id)} onChange={(event) => { const checked = event.currentTarget.checked; setFolderDraftIds((current) => checked ? [...current, folder.id] : current.filter((id) => id !== folder.id)); }} /><span>{folder.name}</span></label>)}</fieldset> : <p className="mt-5 text-sm text-[#686868]">No folders yet. Create one from All folders.</p>}
              <div className="mt-6 flex justify-end gap-5"><DialogClose className="ledger-focus min-h-11 py-2 text-sm text-[#686868]">Cancel</DialogClose><button type="button" onClick={confirmFolders} className="ledger-focus min-h-11 py-2 text-sm font-medium underline decoration-black/25 underline-offset-4">Apply folders</button></div>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>
    </main>
  );
}
