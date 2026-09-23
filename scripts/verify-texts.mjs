import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
const ownerId = `texts-${randomUUID()}`;
const otherId = `texts-${randomUUID()}`;
const noteId = randomUUID();
const otherNoteId = randomUUID();
const folderId = randomUUID();
const otherFolderId = randomUUID();

try {
  await sql`insert into "user" (id, name, email) values (${ownerId}, 'Texts Owner', ${`${ownerId}@example.invalid`})`;
  await sql`insert into "user" (id, name, email) values (${otherId}, 'Texts Other', ${`${otherId}@example.invalid`})`;
  await sql`insert into text_notes (id, user_id, journal_date, title) values (${noteId}, ${ownerId}, '2026-09-23', 'Owner note')`;
  await sql`insert into text_notes (id, user_id, journal_date, title) values (${otherNoteId}, ${otherId}, '2026-09-23', 'Other note')`;
  await sql`insert into text_folders (id, user_id, name, normalized_name) values (${folderId}, ${ownerId}, 'Ideas', 'ideas')`;
  await sql`insert into text_folders (id, user_id, name, normalized_name) values (${otherFolderId}, ${otherId}, 'Other', 'other')`;
  await sql`insert into text_note_folders (user_id, note_id, folder_id) values (${ownerId}, ${noteId}, ${folderId})`;

  const ownerNotes = await sql`select id from text_notes where user_id = ${ownerId}`;
  if (ownerNotes.length !== 1 || ownerNotes[0].id !== noteId) throw new Error("Owner-scoped Texts reads leaked another user's note.");

  for (const query of [
    () => sql`insert into text_note_folders (user_id, note_id, folder_id) values (${ownerId}, ${noteId}, ${otherFolderId})`,
    () => sql`insert into text_note_folders (user_id, note_id, folder_id) values (${otherId}, ${noteId}, ${folderId})`,
  ]) {
    let rejected = false;
    try { await query(); } catch { rejected = true; }
    if (!rejected) throw new Error("A Texts folder membership crossed account boundaries.");
  }

  await sql`delete from text_folders where id = ${folderId} and user_id = ${ownerId}`;
  const [noteAfterFolderDelete] = await sql`select id from text_notes where id = ${noteId} and user_id = ${ownerId}`;
  const memberships = await sql`select note_id from text_note_folders where note_id = ${noteId}`;
  if (!noteAfterFolderDelete || memberships.length !== 0) throw new Error("Deleting a folder deleted its note or retained membership rows.");

  const replacementFolderId = randomUUID();
  await sql`insert into text_folders (id, user_id, name, normalized_name) values (${replacementFolderId}, ${ownerId}, 'Replacement', 'replacement')`;
  await sql`insert into text_note_folders (user_id, note_id, folder_id) values (${ownerId}, ${noteId}, ${replacementFolderId})`;
  await sql`delete from text_notes where id = ${noteId} and user_id = ${ownerId}`;
  const membershipsAfterNoteDelete = await sql`select note_id from text_note_folders where note_id = ${noteId}`;
  if (membershipsAfterNoteDelete.length !== 0) throw new Error("Deleting a note retained folder membership rows.");

  console.log("Texts owner isolation, membership ownership, and note/folder deletion invariants verified.");
} finally {
  await sql`delete from "user" where id = ${ownerId}`;
  await sql`delete from "user" where id = ${otherId}`;
}
