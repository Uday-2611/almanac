"use client";

import { Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import {
  Dialog, DialogBackdrop, DialogClose, DialogDescription, DialogPopup,
  DialogPortal, DialogTitle, DialogViewport,
} from "@/components/ui/dialog";
import { responseErrorMessage } from "@/lib/http/client-errors";
import { textDraftStorageKey, type TextDraftSnapshot } from "@/lib/texts/autosave";
import { formatJournalMonth, groupTextNotesByMonth } from "@/lib/texts/grouping";

type Folder = { id: string; name: string };
type Note = { id: string; title: string | null; journalDate: string; createdAt: string; updatedAt: string; folders: Folder[] };
type TextsJournalProps = {
  activeFolderId?: string;
  activeMonth?: string;
  allNotes: Note[];
  currentHref: string;
  folders: Folder[];
  months: string[];
  notes: Note[];
  showFolders: boolean;
  userId: string;
};

function formatDay(date: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function SmallDialog({ children, description, onOpenChange, open, title }: {
  children: React.ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop className="fixed inset-0 z-[70] bg-white/70 backdrop-blur-[12px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogViewport data-lenis-prevent className="fixed inset-0 z-[80] flex overflow-y-auto p-3 sm:p-8">
          <DialogPopup className="relative m-auto w-full max-w-[34rem] rounded-[4px] border border-black/10 bg-white px-5 py-6 text-[#111111] outline-none transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 sm:px-7">
            <DialogTitle className="pr-10 text-lg font-semibold tracking-[-0.025em]">{title}</DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-[#686868]">{description}</DialogDescription>
            <DialogClose className="ledger-focus absolute right-4 top-4 flex size-11 items-center justify-center rounded-[4px] text-[#686868] hover:bg-black/[0.04] hover:text-[#111111]" aria-label="Close dialog"><X className="size-4" /></DialogClose>
            {children}
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}

export function TextsJournal({ activeFolderId, activeMonth, allNotes, currentHref, folders, months, notes, showFolders, userId }: TextsJournalProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [renameName, setRenameName] = useState("");
  const [pending, setPending] = useState(false);
  const [folderError, setFolderError] = useState("");
  const activeFolder = activeFolderId ? folders.find((folder) => folder.id === activeFolderId) : undefined;
  const groupedNotes = groupTextNotesByMonth(notes);
  const filteredNotes = useMemo(() => {
    const query = noteSearch.trim().toLocaleLowerCase("en-US");
    return query ? allNotes.filter((note) => (note.title || "Untitled note").toLocaleLowerCase("en-US").includes(query)) : allNotes;
  }, [allNotes, noteSearch]);

  function createNote() {
    const noteId = crypto.randomUUID();
    const now = new Date();
    const draft: TextDraftSnapshot = {
      noteId, title: "", body: "", journalDate: now.toISOString().slice(0, 10), folderIds: activeFolderId ? [activeFolderId] : [],
      revision: 0, changedAt: now.toISOString(), confirmedUpdatedAt: null,
    };
    localStorage.setItem(textDraftStorageKey(userId, noteId), JSON.stringify(draft));
    router.push(`/texts/${noteId}?new=1&returnTo=${encodeURIComponent(currentHref)}`);
  }

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFolderError("");
    setPending(true);
    try {
      const response = await fetch("/api/text-folders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: folderName, noteIds: selectedNoteIds }) });
      if (!response.ok) return setFolderError(await responseErrorMessage(response, "The folder could not be created."));
      setFolderName(""); setNoteSearch(""); setSelectedNoteIds([]); setCreateOpen(false); router.refresh();
    } catch {
      setFolderError("The folder could not be created. Check your connection and try again.");
    } finally { setPending(false); }
  }

  async function renameFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingFolder) return;
    if (renameName.trim() === editingFolder.name) return setEditingFolder(null);
    setFolderError(""); setPending(true);
    try {
      const response = await fetch(`/api/text-folders/${editingFolder.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: renameName }) });
      if (!response.ok) return setFolderError(await responseErrorMessage(response, "The folder could not be renamed."));
      setEditingFolder(null); router.refresh();
    } catch { setFolderError("The folder could not be renamed. Check your connection and try again."); }
    finally { setPending(false); }
  }

  async function deleteFolder() {
    if (!deletingFolder) return;
    setFolderError(""); setPending(true);
    try {
      const response = await fetch(`/api/text-folders/${deletingFolder.id}`, { method: "DELETE" });
      if (!response.ok) return setFolderError(await responseErrorMessage(response, "The folder could not be deleted."));
      const deletedId = deletingFolder.id;
      setDeletingFolder(null);
      if (activeFolderId === deletedId) router.replace("/texts?view=folders"); else router.refresh();
    } catch { setFolderError("The folder could not be deleted. Check your connection and try again."); }
    finally { setPending(false); }
  }

  function setCreateDialogOpen(open: boolean) {
    setCreateOpen(open);
    if (!open) { setFolderError(""); setNoteSearch(""); }
  }

  return (
    <main className="min-h-screen px-5 pb-20 pt-24 sm:px-10 sm:pt-32 lg:px-[8vw] lg:pt-[18vh]">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="flex flex-col gap-7 border-b border-black/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#686868]">Private journal</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Texts</h1>
            <p className="mt-2 text-sm text-[#686868]">{showFolders ? `${folders.length} ${folders.length === 1 ? "folder" : "folders"}` : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}</p>
          </div>
          <button type="button" onClick={showFolders ? () => setCreateOpen(true) : createNote} className="ledger-focus min-h-11 self-start py-2 text-left text-sm font-medium underline decoration-black/25 underline-offset-4 hover:decoration-black sm:min-h-0 sm:self-auto">{showFolders ? "New folder +" : "New note +"}</button>
        </header>

        <nav aria-label="Text journal views" className="mt-7 flex flex-wrap items-center gap-x-2 text-sm">
          <Link href="/texts" className={`ledger-focus min-h-11 px-1 py-3 sm:min-h-0 sm:py-2 ${!showFolders && !activeFolderId && !activeMonth ? "font-semibold text-[#111111]" : "text-[#686868] hover:text-[#111111]"}`}>All notes</Link>
          <span aria-hidden="true" className="text-black/25">/</span>
          <Link href="/texts?view=folders" className={`ledger-focus min-h-11 px-1 py-3 sm:min-h-0 sm:py-2 ${showFolders ? "font-semibold text-[#111111]" : "text-[#686868] hover:text-[#111111]"}`}>All folders</Link>
        </nav>

        {activeFolder ? (
          <section className="mt-8 border-b border-black/10 pb-7" aria-labelledby="active-text-folder-heading">
            <Link href="/texts?view=folders" className="ledger-focus inline-flex min-h-11 items-center py-2 text-xs text-[#686868] hover:text-[#111111] sm:min-h-0">← Back to all folders</Link>
            <h2 id="active-text-folder-heading" className="mt-4 break-words text-[clamp(1.75rem,5vw,3rem)] font-semibold leading-none tracking-[-0.045em]">{activeFolder.name}</h2>
            <p className="mt-3 text-sm text-[#686868]">{notes.length} {notes.length === 1 ? "note" : "notes"}</p>
          </section>
        ) : null}

        {folderError && !createOpen && !editingFolder && !deletingFolder ? <p role="alert" className="mt-3 text-sm text-red-700">{folderError}</p> : null}

        {showFolders ? (
          <section aria-label="Text folders" className="mt-10 border-t border-black/10">
            {folders.length ? <ol>{folders.map((folder) => {
              const noteCount = allNotes.filter((note) => note.folders.some((membership) => membership.id === folder.id)).length;
              return <li key={folder.id} className="flex min-h-[76px] items-center gap-3 border-b border-black/10 py-3">
                <Link href={`/texts?folder=${folder.id}`} className="ledger-focus min-w-0 flex-1 py-3"><strong className="block truncate text-sm font-semibold">{folder.name}</strong><span className="mt-1 block text-xs text-[#686868]">{noteCount} {noteCount === 1 ? "note" : "notes"}</span></Link>
                <button type="button" onClick={() => { setRenameName(folder.name); setFolderError(""); setEditingFolder(folder); }} className="ledger-focus flex size-11 shrink-0 items-center justify-center rounded-[4px] text-[#686868] hover:bg-black/[0.04] hover:text-[#111111]" aria-label={`Rename ${folder.name}`}><Pencil className="size-4" /></button>
                <button type="button" onClick={() => { setFolderError(""); setDeletingFolder(folder); }} className="ledger-focus flex size-11 shrink-0 items-center justify-center rounded-[4px] text-[#686868] hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${folder.name}`}><Trash2 className="size-4" /></button>
              </li>;
            })}</ol> : <p className="mt-10 max-w-md text-sm leading-6 text-[#686868]">No folders yet. Create one to organize notes without making separate copies.</p>}
          </section>
        ) : <>
          {!activeFolder && months.length ? <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-[#686868]"><span className="mr-1 uppercase tracking-[0.14em]">Months</span>{months.map((month, index) => <span key={month} className="flex items-center gap-2">{index > 0 ? <span aria-hidden="true" className="text-black/25">/</span> : null}<Link href={`/texts?month=${month}`} className={`ledger-focus px-1 py-2 hover:text-[#111111] ${activeMonth === month ? "font-semibold text-[#111111]" : ""}`}>{formatJournalMonth(month)}</Link></span>)}</div> : null}
          <section aria-label="Journal notes" className="mt-12">
            {groupedNotes.length ? groupedNotes.map((group) => <section key={group.key} className="mb-12"><h2 className="border-b border-black/10 pb-3 text-xs font-medium uppercase tracking-[0.14em] text-[#686868]">{formatJournalMonth(group.key)}</h2><ol>{group.notes.map((note) => <li key={note.id} className="border-b border-black/10"><Link href={{ pathname: `/texts/${note.id}`, query: { returnTo: currentHref } }} className="ledger-focus grid min-h-[92px] grid-cols-[5.25rem_1fr] gap-4 py-5 sm:grid-cols-[8rem_1fr] sm:gap-8"><span className="text-sm text-[#686868]">{formatDay(note.journalDate)}</span><span className="min-w-0"><strong className="block break-words font-semibold tracking-[-0.015em]">{note.title || "Untitled note"}</strong><span className="mt-1.5 block text-sm text-[#686868]">{note.folders.length ? note.folders.map((folder) => folder.name).join(" / ") : "Unfiled"}</span></span></Link></li>)}</ol></section>) : <p className="max-w-md text-sm leading-6 text-[#686868]">{activeFolderId || activeMonth ? "No notes in this view. Choose All notes or write a new note here." : "Nothing here yet. Write a note to begin your journal."}</p>}
          </section>
        </>}
      </div>

      <SmallDialog open={createOpen} onOpenChange={setCreateDialogOpen} title="New folder" description="Name the folder and choose any notes to include.">
        <form onSubmit={createFolder} className="mt-6">
          <label className="block text-xs text-[#686868]">Folder name<input autoFocus value={folderName} onChange={(event) => setFolderName(event.currentTarget.value)} maxLength={100} placeholder="Folder name" className="ledger-focus mt-2 min-h-11 w-full rounded-[4px] bg-black/[0.035] px-3 text-sm text-[#111111] outline-none" /></label>
          <label className="mt-5 block text-xs text-[#686868]">Search notes<input type="search" value={noteSearch} onChange={(event) => setNoteSearch(event.currentTarget.value)} placeholder="Search by note title" className="ledger-focus mt-2 min-h-11 w-full rounded-[4px] bg-black/[0.035] px-3 text-sm text-[#111111] outline-none" /></label>
          <fieldset className="mt-4 max-h-60 overflow-y-auto border-y border-black/10"><legend className="sr-only">Notes to add</legend>{filteredNotes.length ? filteredNotes.map((note) => <label key={note.id} className="ledger-focus flex min-h-12 cursor-pointer items-center gap-3 border-b border-black/10 px-1 py-2 text-sm last:border-b-0"><input type="checkbox" className="size-4 accent-black" checked={selectedNoteIds.includes(note.id)} onChange={(event) => { const checked = event.currentTarget.checked; setSelectedNoteIds((current) => checked ? [...current, note.id] : current.filter((id) => id !== note.id)); }} /><span className="min-w-0 truncate">{note.title || "Untitled note"}</span><span className="ml-auto shrink-0 text-xs text-[#686868]">{formatDay(note.journalDate)}</span></label>) : <p className="py-5 text-sm text-[#686868]">No matching notes.</p>}</fieldset>
          {folderError ? <p role="alert" className="mt-3 text-sm text-red-700">{folderError}</p> : null}
          <div className="mt-6 flex justify-end gap-5"><DialogClose className="ledger-focus min-h-11 py-2 text-sm text-[#686868]">Cancel</DialogClose><button type="submit" disabled={pending || !folderName.trim()} className="ledger-focus min-h-11 py-2 text-sm font-medium underline decoration-black/25 underline-offset-4 disabled:opacity-35">{pending ? "Creating…" : "Create folder"}</button></div>
        </form>
      </SmallDialog>

      <SmallDialog open={Boolean(editingFolder)} onOpenChange={(open) => { if (!open) setEditingFolder(null); }} title="Rename folder" description="Confirm the new name for this folder.">
        <form onSubmit={renameFolder} className="mt-6"><label className="block text-xs text-[#686868]">Folder name<input autoFocus value={renameName} onChange={(event) => setRenameName(event.currentTarget.value)} maxLength={100} className="ledger-focus mt-2 min-h-11 w-full rounded-[4px] bg-black/[0.035] px-3 text-sm text-[#111111] outline-none" /></label>{folderError ? <p role="alert" className="mt-3 text-sm text-red-700">{folderError}</p> : null}<div className="mt-6 flex justify-end gap-5"><button type="button" onClick={() => setEditingFolder(null)} className="ledger-focus min-h-11 py-2 text-sm text-[#686868]">Cancel</button><button type="submit" disabled={pending || !renameName.trim()} className="ledger-focus min-h-11 py-2 text-sm font-medium underline decoration-black/25 underline-offset-4 disabled:opacity-35">{pending ? "Renaming…" : "Rename folder"}</button></div></form>
      </SmallDialog>

      <SmallDialog open={Boolean(deletingFolder)} onOpenChange={(open) => { if (!open) setDeletingFolder(null); }} title="Delete folder?" description={`The notes in ${deletingFolder?.name ?? "this folder"} will remain safely in All notes.`}>
        {folderError ? <p role="alert" className="mt-4 text-sm text-red-700">{folderError}</p> : null}<div className="mt-6 flex justify-end gap-5"><button type="button" onClick={() => setDeletingFolder(null)} className="ledger-focus min-h-11 py-2 text-sm text-[#686868]">Keep folder</button><button type="button" disabled={pending} onClick={deleteFolder} className="ledger-focus min-h-11 py-2 text-sm text-red-700 disabled:opacity-35">{pending ? "Deleting…" : "Delete folder"}</button></div>
      </SmallDialog>
    </main>
  );
}
