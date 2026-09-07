import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
const userId = `invariant-${randomUUID()}`;
const movieId = randomUUID();
const listId = randomUUID();
const tmdbId = Math.floor(Math.random() * 1_000_000_000);

try {
  await sql`insert into "user" (id, name, email) values (${userId}, 'Invariant Test', ${`${userId}@example.invalid`})`;
  await sql`insert into movies (id, user_id, tmdb_id, title, status) values (${movieId}, ${userId}, ${tmdbId}, 'Invariant Test Movie', 'watchlist')`;
  await sql`insert into movie_lists (id, user_id, name) values (${listId}, ${userId}, 'Invariant Test List')`;

  let watchlistInsertWasRejected = false;
  try {
    await sql`insert into movie_list_items (list_id, movie_id) values (${listId}, ${movieId})`;
  } catch {
    watchlistInsertWasRejected = true;
  }
  if (!watchlistInsertWasRejected) throw new Error("A watchlist movie was incorrectly accepted into a custom list.");

  await sql`update movies set status = 'watched' where id = ${movieId} and user_id = ${userId}`;
  await sql`insert into movie_list_items (list_id, movie_id) values (${listId}, ${movieId})`;

  await sql`update movies set status = 'watchlist' where id = ${movieId} and user_id = ${userId}`;
  const remaining = await sql`select count(*)::int as count from movie_list_items where movie_id = ${movieId}`;
  if (remaining[0].count !== 0) throw new Error("Moving a movie to watchlist left stale custom-list memberships.");

  console.log("Movie list invariants verified.");
} finally {
  await sql`delete from "user" where id = ${userId}`;
}
