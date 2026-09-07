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

export const movieListItemSchema = z.object({ movieId: idSchema });
