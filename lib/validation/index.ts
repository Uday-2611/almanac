import { z } from "zod";

export const idSchema = z.uuid();

export const createMovieSchema = z.object({
  tmdbId: z.number().int().positive(),
  status: z.enum(["watchlist", "watched"]).default("watchlist"),
});

export const updateMovieSchema = z.object({
  status: z.enum(["watchlist", "watched"]).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  review: z.string().max(20_000).nullable().optional(),
  loggedDate: z.iso.date().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const createMovieListSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateMovieListSchema = createMovieListSchema;

export const movieListItemSchema = z.object({ movieId: idSchema });

export const createBookSchema = z.object({
  provider: z.enum(["open_library", "google_books"]).default("open_library"),
  providerId: z.string().trim().min(1).max(128),
  status: z.enum(["want_to_read", "read"]).default("want_to_read"),
}).superRefine((value, context) => {
  const valid = value.provider === "open_library"
    ? /^OL\d+W$/.test(value.providerId)
    : /^[A-Za-z0-9_-]+$/.test(value.providerId);
  if (!valid) context.addIssue({ code: "custom", message: "Invalid provider ID.", path: ["providerId"] });
});

export const updateBookSchema = z.object({
  status: z.enum(["want_to_read", "read"]).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  review: z.string().max(20_000).nullable().optional(),
  loggedDate: z.iso.date().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const createBookListSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateBookListSchema = createBookListSchema;
export const bookListItemSchema = z.object({ bookId: idSchema });
