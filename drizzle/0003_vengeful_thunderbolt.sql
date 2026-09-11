CREATE TYPE "public"."tmdb_media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
ALTER TABLE "movies" RENAME COLUMN "director" TO "creator";--> statement-breakpoint
DROP INDEX "movies_user_tmdb_idx";--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "media_type" "tmdb_media_type" DEFAULT 'movie' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "movies_user_media_tmdb_idx" ON "movies" USING btree ("user_id","media_type","tmdb_id");