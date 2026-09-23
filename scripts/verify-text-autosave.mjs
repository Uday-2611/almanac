import assert from "node:assert/strict";

import {
  canClearLocalTextDraft,
  nextTextRevision,
  parseTextDraft,
  shouldOfferTextDraftRecovery,
} from "../lib/texts/autosave.ts";
import { groupTextNotesByMonth } from "../lib/texts/grouping.ts";
import {
  createTextFolderSchema,
  MAX_TEXT_BODY_LENGTH,
  saveTextNoteSchema,
} from "../lib/validation/index.ts";

const id = "0fba3f7d-31bb-41af-8f88-df96502bce8f";
const folderId = "dcf67ad4-67ed-4266-8729-054c0117a3b6";
const base = {
  noteId: id,
  title: "First",
  body: "Draft",
  journalDate: "2026-09-23",
  folderIds: [folderId],
  revision: 4,
  changedAt: "2026-09-23T10:00:00.000Z",
  confirmedUpdatedAt: "2026-09-23T09:00:00.000Z",
};

assert.equal(createTextFolderSchema.safeParse({ name: "   " }).success, false);
assert.equal(createTextFolderSchema.safeParse({ name: "Ideas", extra: true }).success, false);
assert.equal(createTextFolderSchema.safeParse({ name: "Ideas", noteIds: ["not-an-id"] }).success, false);
assert.deepEqual(createTextFolderSchema.parse({ name: "Ideas", noteIds: [id, id] }).noteIds, [id]);
assert.equal(saveTextNoteSchema.safeParse({ title: null, body: "", journalDate: "2026-02-30", folderIds: [], revision: 0 }).success, false);
assert.equal(saveTextNoteSchema.safeParse({ title: null, body: "x".repeat(MAX_TEXT_BODY_LENGTH + 1), journalDate: "2026-09-23", folderIds: [], revision: 0 }).success, false);
const deduplicated = saveTextNoteSchema.parse({ title: "  A title  ", body: "Text", journalDate: "2026-09-23", folderIds: [folderId, folderId], revision: 1 });
assert.deepEqual(deduplicated.folderIds, [folderId]);
assert.equal(deduplicated.title, "A title");

const grouped = groupTextNotesByMonth([
  { id: "1", journalDate: "2026-09-23" },
  { id: "2", journalDate: "2026-09-23" },
  { id: "3", journalDate: "2026-08-31" },
]);
assert.deepEqual(grouped.map((group) => [group.key, group.notes.length]), [["2026-09", 2], ["2026-08", 1]]);

assert.equal(nextTextRevision(4, 3), 5);
assert.equal(nextTextRevision(4, 9), 10);
const newer = { ...base, body: "Newer text", revision: 5, changedAt: "2026-09-23T10:01:00.000Z" };
assert.equal(canClearLocalTextDraft(base, newer, true), false, "An older response must not clear a newer local edit.");
assert.equal(canClearLocalTextDraft(base, base, false), false, "A failed request must retain the local draft.");
assert.equal(shouldOfferTextDraftRecovery(newer, { id, clientRevision: 4, updatedAt: "2026-09-23T10:00:30.000Z" }), true);
assert.equal(shouldOfferTextDraftRecovery(base, { id, clientRevision: 5, updatedAt: "2026-09-23T10:02:00.000Z" }), false);
assert.deepEqual(parseTextDraft(JSON.stringify(newer)), newer);
assert.equal(parseTextDraft("not json"), null);

console.log("Texts validation, month grouping, autosave ordering, failure retention, and draft recovery verified.");
