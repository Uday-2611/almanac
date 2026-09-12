import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
const userId = `archive-tag-${randomUUID()}`;
const otherUserId = `archive-tag-${randomUUID()}`;
const movieId = randomUUID();
const bookId = randomUUID();
const tagId = randomUUID();
const otherTagId = randomUUID();
const tmdbId = Math.floor(Math.random() * 1_000_000_000);
const providerId = `OL${Math.floor(Math.random() * 1_000_000_000)}W`;

try {
  await sql`insert into "user" (id, name, email) values (${userId}, 'Archive Tag Test', ${`${userId}@example.invalid`})`;
  await sql`insert into "user" (id, name, email) values (${otherUserId}, 'Other Archive Tag Test', ${`${otherUserId}@example.invalid`})`;
  await sql`insert into movies (id, user_id, tmdb_id, title) values (${movieId}, ${userId}, ${tmdbId}, 'Archive Tag Movie')`;
  await sql`insert into books (id, user_id, provider_id, title) values (${bookId}, ${userId}, ${providerId}, 'Archive Tag Book')`;
  await sql`insert into tags (id, user_id, name, normalized_name) values (${tagId}, ${userId}, 'Quiet', 'quiet')`;
  await sql`insert into tags (id, user_id, name, normalized_name) values (${otherTagId}, ${otherUserId}, 'Other', 'other')`;

  await sql`insert into movie_tags (movie_id, tag_id) values (${movieId}, ${tagId})`;
  await sql`insert into book_tags (book_id, tag_id) values (${bookId}, ${tagId})`;

  for (const query of [
    () => sql`insert into movie_tags (movie_id, tag_id) values (${movieId}, ${otherTagId})`,
    () => sql`insert into book_tags (book_id, tag_id) values (${bookId}, ${otherTagId})`,
  ]) {
    let rejected = false;
    try {
      await query();
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("A tag was attached across user boundaries.");
  }

  await sql`update movies set archive_note = 'A persistent movie note.' where id = ${movieId} and user_id = ${userId}`;
  await sql`update books set archive_note = 'A persistent book note.' where id = ${bookId} and user_id = ${userId}`;
  const [movie] = await sql`select archive_note from movies where id = ${movieId} and user_id = ${userId}`;
  const [book] = await sql`select archive_note from books where id = ${bookId} and user_id = ${userId}`;
  if (movie?.archive_note !== "A persistent movie note." || book?.archive_note !== "A persistent book note.") {
    throw new Error("Archive notes did not persist.");
  }

  const [reuse] = await sql`
    select count(*)::int as count
    from tags t
    left join movie_tags mt on mt.tag_id = t.id
    left join book_tags bt on bt.tag_id = t.id
    where t.id = ${tagId} and t.user_id = ${userId} and mt.movie_id = ${movieId} and bt.book_id = ${bookId}
  `;
  if (reuse?.count !== 1) throw new Error("The same reusable tag was not attached to both entry types.");

  console.log("Archive note persistence and tag ownership invariants verified.");
} finally {
  await sql`delete from "user" where id = ${userId}`;
  await sql`delete from "user" where id = ${otherUserId}`;
}
