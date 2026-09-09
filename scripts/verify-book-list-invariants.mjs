import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
const userId = `book-invariant-${randomUUID()}`;
const otherUserId = `book-invariant-${randomUUID()}`;
const bookId = randomUUID();
const listId = randomUUID();
const otherListId = randomUUID();
const replacementListId = randomUUID();
const providerId = `OL${Math.floor(Math.random() * 1_000_000_000)}W`;

try {
  await sql`insert into "user" (id, name, email) values (${userId}, 'Book Invariant Test', ${`${userId}@example.invalid`})`;
  await sql`insert into "user" (id, name, email) values (${otherUserId}, 'Other Book Invariant Test', ${`${otherUserId}@example.invalid`})`;
  await sql`insert into books (id, user_id, provider_id, title, status) values (${bookId}, ${userId}, ${providerId}, 'Invariant Test Book', 'want_to_read')`;
  await sql`insert into book_lists (id, user_id, name) values (${listId}, ${userId}, 'Invariant Test List')`;
  await sql`insert into book_lists (id, user_id, name) values (${otherListId}, ${otherUserId}, 'Other User List')`;

  let unreadInsertWasRejected = false;
  try {
    await sql`insert into book_list_items (list_id, book_id) values (${listId}, ${bookId})`;
  } catch {
    unreadInsertWasRejected = true;
  }
  if (!unreadInsertWasRejected) throw new Error("A Want to Read book was incorrectly accepted into a custom list.");

  await sql`update books set status = 'read' where id = ${bookId} and user_id = ${userId}`;

  let crossUserInsertWasRejected = false;
  try {
    await sql`insert into book_list_items (list_id, book_id) values (${otherListId}, ${bookId})`;
  } catch {
    crossUserInsertWasRejected = true;
  }
  if (!crossUserInsertWasRejected) throw new Error("A book was incorrectly accepted into another user's list.");

  await sql`insert into book_list_items (list_id, book_id) values (${listId}, ${bookId})`;

  await sql`update book_lists set name = 'Renamed Invariant List' where id = ${listId} and user_id = ${userId}`;
  const renamed = await sql`select name from book_lists where id = ${listId} and user_id = ${userId}`;
  if (renamed[0]?.name !== "Renamed Invariant List") throw new Error("A user-owned book list could not be renamed.");

  await sql`delete from book_lists where id = ${listId} and user_id = ${userId}`;
  const deletedMemberships = await sql`select count(*)::int as count from book_list_items where list_id = ${listId}`;
  if (deletedMemberships[0].count !== 0) throw new Error("Deleting a book list left stale memberships.");

  await sql`insert into book_lists (id, user_id, name) values (${replacementListId}, ${userId}, 'Replacement Invariant List')`;
  await sql`insert into book_list_items (list_id, book_id) values (${replacementListId}, ${bookId})`;

  await sql`update books set status = 'want_to_read' where id = ${bookId} and user_id = ${userId}`;
  const remaining = await sql`select count(*)::int as count from book_list_items where book_id = ${bookId}`;
  if (remaining[0].count !== 0) throw new Error("Moving a book to Want to Read left stale custom-list memberships.");

  console.log("Book list invariants verified.");
} finally {
  await sql`delete from "user" where id = ${userId}`;
  await sql`delete from "user" where id = ${otherUserId}`;
}
