import type { Metadata } from "next";

import { TextsJournal } from "@/components/texts/texts-journal";
import { getCurrentUser } from "@/lib/auth/session";
import { listTextFoldersForUser, listTextNoteMonthsForUser, listTextNotesForUser } from "@/lib/db/queries/texts";
import { idSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Texts" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TextsPage({ searchParams }: PageProps<"/texts">) {
  const user = await getCurrentUser();
  if (!user) return null;
  const query = await searchParams;
  const requestedFolder = first(query.folder);
  const requestedMonth = first(query.month);
  const showFolders = first(query.view) === "folders" && !requestedFolder && !requestedMonth;
  const [folders, months] = await Promise.all([
    listTextFoldersForUser(user.id),
    listTextNoteMonthsForUser(user.id),
  ]);
  const activeFolderId = idSchema.safeParse(requestedFolder).success && folders.some((folder) => folder.id === requestedFolder)
    ? requestedFolder
    : undefined;
  const activeMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth ?? "") && months.includes(requestedMonth!)
    ? requestedMonth
    : undefined;
  const allNotes = await listTextNotesForUser(user.id);
  const notes = activeMonth
    ? allNotes.filter((note) => note.journalDate.startsWith(activeMonth))
    : activeFolderId
      ? allNotes.filter((note) => note.folders.some((folder) => folder.id === activeFolderId))
      : allNotes;
  const currentHref = activeMonth ? `/texts?month=${activeMonth}` : activeFolderId ? `/texts?folder=${activeFolderId}` : showFolders ? "/texts?view=folders" : "/texts";

  return <TextsJournal
    activeFolderId={activeFolderId}
    activeMonth={activeMonth}
    allNotes={allNotes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() }))}
    currentHref={currentHref}
    folders={folders.map(({ id, name }) => ({ id, name }))}
    months={months}
    notes={notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() }))}
    showFolders={showFolders}
    userId={user.id}
  />;
}
