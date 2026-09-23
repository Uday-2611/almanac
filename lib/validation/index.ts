import { z } from "zod";

export const MAX_REVIEW_LENGTH = 20_000;
export const MAX_ARCHIVE_NOTE_LENGTH = 100_000;
export const MAX_LIST_NAME_LENGTH = 100;
export const MAX_TAG_NAME_LENGTH = 64;
export const MAX_TEXT_TITLE_LENGTH = 300;
export const MAX_TEXT_BODY_LENGTH = 100_000;
export const MAX_TEXT_FOLDER_NAME_LENGTH = 100;

export const idSchema = z.uuid();

const completionDateSchema = z.iso.date().refine(
  (value) => value <= new Date().toISOString().slice(0, 10),
  "The completion date cannot be in the future.",
);

export const createMovieSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]).default("movie"),
  status: z.enum(["watchlist", "watched"]).default("watchlist"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  review: z.string().max(MAX_REVIEW_LENGTH, `Reviews cannot exceed ${MAX_REVIEW_LENGTH.toLocaleString("en-US")} characters.`).nullable().optional(),
  loggedDate: completionDateSchema.nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.status === "watched") return;
  if (value.rating !== undefined || value.review !== undefined || value.loggedDate !== undefined) {
    context.addIssue({
      code: "custom",
      message: "Watched details can only be saved to the Watched collection.",
      path: ["status"],
    });
  }
});

export const updateMovieSchema = z.object({
  status: z.enum(["watchlist", "watched"]).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  review: z.string().max(MAX_REVIEW_LENGTH, `Reviews cannot exceed ${MAX_REVIEW_LENGTH.toLocaleString("en-US")} characters.`).nullable().optional(),
  loggedDate: completionDateSchema.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const createMovieListSchema = z.object({
  name: z.string().trim().min(1, "Enter a list name.").max(MAX_LIST_NAME_LENGTH, "List names cannot exceed 100 characters."),
}).strict();

export const updateMovieListSchema = createMovieListSchema;

export const movieListItemSchema = z.object({ movieId: idSchema }).strict();

export const createBookSchema = z.object({
  provider: z.enum(["open_library", "google_books"]).default("open_library"),
  providerId: z.string().trim().min(1).max(128),
  status: z.enum(["want_to_read", "read"]).default("want_to_read"),
  titleHint: z.string().trim().min(1).max(300).optional(),
  authorHints: z.array(z.string().trim().min(1).max(200)).max(12).optional(),
}).strict().superRefine((value, context) => {
  const valid = value.provider === "open_library"
    ? /^OL\d+W$/.test(value.providerId)
    : /^[A-Za-z0-9_-]+$/.test(value.providerId);
  if (!valid) context.addIssue({ code: "custom", message: "Invalid provider ID.", path: ["providerId"] });
});

export const updateBookSchema = z.object({
  status: z.enum(["want_to_read", "read"]).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  review: z.string().max(MAX_REVIEW_LENGTH, `Reviews cannot exceed ${MAX_REVIEW_LENGTH.toLocaleString("en-US")} characters.`).nullable().optional(),
  loggedDate: completionDateSchema.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const createBookListSchema = z.object({
  name: z.string().trim().min(1, "Enter a list name.").max(MAX_LIST_NAME_LENGTH, "List names cannot exceed 100 characters."),
}).strict();

export const updateBookListSchema = createBookListSchema;
export const bookListItemSchema = z.object({ bookId: idSchema }).strict();

const importClientIdSchema = z.string().min(1).max(700);
const importTitleSchema = z.string().trim().min(1).max(300);

export const mediaImportBatchSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("letterboxd"),
    items: z.array(z.object({
      clientId: importClientIdSchema,
      source: z.literal("letterboxd"),
      status: z.enum(["watchlist", "watched"]),
      title: importTitleSchema,
      year: z.string().regex(/^\d{4}$/).nullable(),
    }).strict()).min(1).max(20),
  }).strict(),
  z.object({
    source: z.literal("goodreads"),
    items: z.array(z.object({
      authors: z.array(z.string().trim().min(1).max(200)).min(1).max(12),
      clientId: importClientIdSchema,
      goodreadsBookId: z.string().trim().min(1).max(300),
      isbn: z.string().regex(/^\d{9}[\dX]$/).nullable(),
      isbn13: z.string().regex(/^\d{13}$/).nullable(),
      pageCount: z.number().int().positive().max(100_000).nullable(),
      publishYear: z.number().int().min(1000).max(9999).nullable(),
      source: z.literal("goodreads"),
      status: z.enum(["want_to_read", "read"]),
      title: importTitleSchema,
    }).strict()).min(1).max(20),
  }).strict(),
]);

export const archiveNoteSchema = z.object({
  note: z.string().max(MAX_ARCHIVE_NOTE_LENGTH, "Archive Notes cannot exceed 100,000 characters.").nullable(),
}).strict();

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Enter a tag name.").max(MAX_TAG_NAME_LENGTH, "Tag names cannot exceed 64 characters."),
}).strict();

const journalDateSchema = z.iso.date().refine(
  (value) => Number(value.slice(0, 4)) >= 1000,
  "Enter a valid journal date.",
);

export const saveTextNoteSchema = z.object({
  title: z.string().max(MAX_TEXT_TITLE_LENGTH, "Titles cannot exceed 300 characters.").nullable(),
  body: z.string().max(MAX_TEXT_BODY_LENGTH, "Notes cannot exceed 100,000 characters."),
  journalDate: journalDateSchema,
  folderIds: z.array(idSchema).max(100, "A note cannot belong to more than 100 folders."),
  revision: z.number().int().min(0).max(2_147_483_647),
}).strict().transform((value) => ({
  ...value,
  title: value.title?.trim() || null,
  folderIds: [...new Set(value.folderIds)],
}));

export const createTextFolderSchema = z.object({
  name: z.string().trim().min(1, "Enter a folder name.").max(MAX_TEXT_FOLDER_NAME_LENGTH, "Folder names cannot exceed 100 characters."),
  noteIds: z.array(idSchema).max(1_000, "A folder cannot be created with more than 1,000 notes at once.").default([]),
}).strict().transform((value) => ({ ...value, noteIds: [...new Set(value.noteIds)] }));

export const updateTextFolderSchema = z.object({
  name: z.string().trim().min(1, "Enter a folder name.").max(MAX_TEXT_FOLDER_NAME_LENGTH, "Folder names cannot exceed 100 characters."),
}).strict();

export function validationErrorMessage(error: z.ZodError, fallback: string) {
  return error.issues[0]?.message || fallback;
}
