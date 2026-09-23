import "server-only";

import { and, asc, desc, eq, exists, gte, inArray, lt, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { textFolders, textNoteFolders, textNotes } from "@/lib/db/schema";

export type TextFolderRecord = typeof textFolders.$inferSelect;
export type TextNoteRecord = typeof textNotes.$inferSelect;
export type TextNoteWithFolders = TextNoteRecord & { folderIds: string[] };
export type TextNoteSummary = Pick<TextNoteRecord, "id" | "title" | "journalDate" | "createdAt" | "updatedAt"> & {
  folders: Pick<TextFolderRecord, "id" | "name">[];
};

export class TextFolderEligibilityError extends Error {}
export class StaleTextRevisionError extends Error {
  constructor(public note: TextNoteWithFolders) {
    super("A newer version of this note is already saved.");
  }
}

export function normalizeTextFolderName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export async function listTextFoldersForUser(userId: string) {
  return getDatabase().select().from(textFolders)
    .where(eq(textFolders.userId, userId))
    .orderBy(asc(textFolders.name));
}

export async function listTextNotesForUser(userId: string, filters?: { month?: string; folderId?: string }) {
  const database = getDatabase();
  const folderFilter = filters?.folderId
    ? exists(database.select({ noteId: textNoteFolders.noteId }).from(textNoteFolders).where(and(
        eq(textNoteFolders.noteId, textNotes.id),
        eq(textNoteFolders.folderId, filters.folderId),
        eq(textNoteFolders.userId, userId),
      )))
    : undefined;
  const start = filters?.month ? `${filters.month}-01` : undefined;
  const [year, month] = filters?.month?.split("-").map(Number) ?? [];
  const end = start ? new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10) : undefined;

  const notes = await database.select({
    id: textNotes.id,
    title: textNotes.title,
    journalDate: textNotes.journalDate,
    createdAt: textNotes.createdAt,
    updatedAt: textNotes.updatedAt,
  }).from(textNotes).where(and(
    eq(textNotes.userId, userId),
    start && end ? and(gte(textNotes.journalDate, start), lt(textNotes.journalDate, end)) : undefined,
    folderFilter,
  )).orderBy(desc(textNotes.journalDate), desc(textNotes.createdAt));

  if (!notes.length) return [];
  const memberships = await database.select({
    noteId: textNoteFolders.noteId,
    folderId: textFolders.id,
    folderName: textFolders.name,
  }).from(textNoteFolders).innerJoin(textFolders, and(
    eq(textNoteFolders.folderId, textFolders.id),
    eq(textNoteFolders.userId, textFolders.userId),
  )).where(and(
    eq(textNoteFolders.userId, userId),
    inArray(textNoteFolders.noteId, notes.map((note) => note.id)),
  )).orderBy(asc(textFolders.name));

  const foldersByNote = new Map<string, { id: string; name: string }[]>();
  for (const membership of memberships) {
    const current = foldersByNote.get(membership.noteId) ?? [];
    current.push({ id: membership.folderId, name: membership.folderName });
    foldersByNote.set(membership.noteId, current);
  }
  return notes.map((note) => ({ ...note, folders: foldersByNote.get(note.id) ?? [] }));
}

export async function listTextNoteMonthsForUser(userId: string) {
  const rows = await getDatabase().select({ journalDate: textNotes.journalDate }).from(textNotes)
    .where(eq(textNotes.userId, userId)).orderBy(desc(textNotes.journalDate));
  return [...new Set(rows.map((row) => row.journalDate.slice(0, 7)))];
}

export async function getTextNoteForUser(userId: string, noteId: string): Promise<TextNoteWithFolders | null> {
  const database = getDatabase();
  const [note] = await database.select().from(textNotes)
    .where(and(eq(textNotes.id, noteId), eq(textNotes.userId, userId))).limit(1);
  if (!note) return null;
  const folders = await database.select({ folderId: textNoteFolders.folderId }).from(textNoteFolders)
    .where(and(eq(textNoteFolders.userId, userId), eq(textNoteFolders.noteId, noteId)));
  return { ...note, folderIds: folders.map((folder) => folder.folderId) };
}

export async function saveTextNoteForUser(userId: string, noteId: string, input: {
  title: string | null;
  body: string;
  journalDate: string;
  folderIds: string[];
  revision: number;
}) {
  const database = getDatabase();
  const ownedFolders = input.folderIds.length
    ? await database.select({ id: textFolders.id }).from(textFolders)
        .where(and(eq(textFolders.userId, userId), inArray(textFolders.id, input.folderIds)))
    : [];
  if (ownedFolders.length !== input.folderIds.length) {
    throw new TextFolderEligibilityError("One or more folders are unavailable.");
  }
  const folderArray = input.folderIds.length
    ? sql`array[${sql.join(input.folderIds.map((folderId) => sql`${folderId}::uuid`), sql`, `)}]::uuid[]`
    : sql`array[]::uuid[]`;

  // The note write and complete membership replacement are one statement. The
  // revision predicate means a delayed request cannot overwrite newer content
  // or restore an older folder set.
  const result = await database.execute<{ id: string }>(sql`
    with saved as (
      insert into text_notes (id, user_id, title, body, journal_date, client_revision)
      values (${noteId}::uuid, ${userId}, ${input.title}, ${input.body}, ${input.journalDate}::date, ${input.revision})
      on conflict (id) do update set
        title = excluded.title,
        body = excluded.body,
        journal_date = excluded.journal_date,
        client_revision = excluded.client_revision,
        updated_at = now()
      where text_notes.user_id = excluded.user_id
        and text_notes.client_revision < excluded.client_revision
      returning id
    ), cleared as (
      delete from text_note_folders
      where user_id = ${userId} and note_id = ${noteId}::uuid
        and exists (select 1 from saved)
        and not (folder_id = any(${folderArray}))
    ), attached as (
      insert into text_note_folders (user_id, note_id, folder_id)
      select ${userId}, ${noteId}::uuid, folder_id
      from unnest(${folderArray}) as folder_id
      where exists (select 1 from saved)
      on conflict (note_id, folder_id) do nothing
    )
    select id from saved
  `);

  if (result.rows.length) return getTextNoteForUser(userId, noteId);
  const current = await getTextNoteForUser(userId, noteId);
  if (!current) return null;
  const sameFolders = [...current.folderIds].sort().join("|") === [...input.folderIds].sort().join("|");
  const isIdempotent = input.revision === current.clientRevision
    && current.title === input.title
    && current.body === input.body
    && current.journalDate === input.journalDate
    && sameFolders;
  if (isIdempotent) return current;
  throw new StaleTextRevisionError(current);
}

export async function deleteTextNoteForUser(userId: string, noteId: string) {
  const [deleted] = await getDatabase().delete(textNotes)
    .where(and(eq(textNotes.id, noteId), eq(textNotes.userId, userId)))
    .returning({ id: textNotes.id });
  return deleted ?? null;
}

export async function createTextFolderForUser(userId: string, name: string, noteIds: string[] = []) {
  const database = getDatabase();
  const ownedNotes = noteIds.length
    ? await database.select({ id: textNotes.id }).from(textNotes)
        .where(and(eq(textNotes.userId, userId), inArray(textNotes.id, noteIds)))
    : [];
  if (ownedNotes.length !== noteIds.length) {
    throw new TextFolderEligibilityError("One or more notes are unavailable.");
  }
  const normalizedName = normalizeTextFolderName(name);
  const displayName = name.trim().replace(/\s+/g, " ");
  const noteArray = noteIds.length
    ? sql`array[${sql.join(noteIds.map((noteId) => sql`${noteId}::uuid`), sql`, `)}]::uuid[]`
    : sql`array[]::uuid[]`;
  const result = await database.execute<{ id: string }>(sql`
    with created as (
      insert into text_folders (user_id, name, normalized_name)
      values (${userId}, ${displayName}, ${normalizedName})
      on conflict (user_id, normalized_name) do nothing
      returning id
    ), attached as (
      insert into text_note_folders (user_id, note_id, folder_id)
      select ${userId}, note_id, created.id
      from created cross join unnest(${noteArray}) as note_id
    )
    select id from created
  `);
  const folderId = result.rows[0]?.id;
  if (!folderId) return null;
  const [folder] = await database.select().from(textFolders)
    .where(and(eq(textFolders.id, folderId), eq(textFolders.userId, userId))).limit(1);
  return folder ?? null;
}

export async function renameTextFolderForUser(userId: string, folderId: string, name: string) {
  const [folder] = await getDatabase().update(textFolders).set({
    name: name.trim().replace(/\s+/g, " "),
    normalizedName: normalizeTextFolderName(name),
    updatedAt: new Date(),
  }).where(and(eq(textFolders.id, folderId), eq(textFolders.userId, userId))).returning();
  return folder ?? null;
}

export async function deleteTextFolderForUser(userId: string, folderId: string) {
  const [folder] = await getDatabase().delete(textFolders)
    .where(and(eq(textFolders.id, folderId), eq(textFolders.userId, userId)))
    .returning({ id: textFolders.id });
  return folder ?? null;
}
