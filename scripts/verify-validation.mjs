import assert from "node:assert/strict";

import {
  archiveNoteSchema,
  createBookListSchema,
  createMovieSchema,
  createMovieListSchema,
  createTagSchema,
  MAX_ARCHIVE_NOTE_LENGTH,
  MAX_REVIEW_LENGTH,
  updateBookSchema,
  updateMovieSchema,
} from "../lib/validation/index.ts";

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

assert.equal(updateMovieSchema.safeParse({ loggedDate: today }).success, true);
assert.equal(updateBookSchema.safeParse({ loggedDate: tomorrow }).success, false);
assert.equal(updateMovieSchema.safeParse({ review: "x".repeat(MAX_REVIEW_LENGTH + 1) }).success, false);
assert.equal(updateBookSchema.safeParse({ rating: 6 }).success, false);
assert.equal(updateMovieSchema.safeParse({ rating: 5, unexpected: true }).success, false);
assert.equal(createMovieSchema.safeParse({ tmdbId: 1, status: "watched", rating: 5, review: "Saved from search.", loggedDate: today }).success, true);
assert.equal(createMovieSchema.safeParse({ tmdbId: 1, status: "watchlist", review: "Not allowed here." }).success, false);
assert.equal(createMovieSchema.safeParse({ tmdbId: 1, status: "watched", loggedDate: tomorrow }).success, false);
assert.equal(createMovieListSchema.safeParse({ name: "   " }).success, false);
assert.equal(createBookListSchema.safeParse({ name: "Reading notes" }).success, true);
assert.equal(createTagSchema.safeParse({ name: "x".repeat(65) }).success, false);
assert.equal(archiveNoteSchema.safeParse({ note: "x".repeat(MAX_ARCHIVE_NOTE_LENGTH + 1) }).success, false);

console.log("Media, list, tag, and Archive Note validation boundaries verified.");
