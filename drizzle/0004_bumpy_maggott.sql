ALTER TABLE "books" ADD COLUMN "archive_note" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "archive_note" text;--> statement-breakpoint

CREATE OR REPLACE FUNCTION enforce_movie_tag_ownership()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "movies" m
    INNER JOIN "tags" t ON t."id" = NEW."tag_id"
    WHERE m."id" = NEW."movie_id" AND m."user_id" = t."user_id"
  ) THEN
    RAISE EXCEPTION 'Movie and tag must belong to the same user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

DROP TRIGGER IF EXISTS movie_tags_owner_guard ON "movie_tags";--> statement-breakpoint
CREATE TRIGGER movie_tags_owner_guard
BEFORE INSERT OR UPDATE ON "movie_tags"
FOR EACH ROW EXECUTE FUNCTION enforce_movie_tag_ownership();--> statement-breakpoint

CREATE OR REPLACE FUNCTION enforce_book_tag_ownership()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "books" b
    INNER JOIN "tags" t ON t."id" = NEW."tag_id"
    WHERE b."id" = NEW."book_id" AND b."user_id" = t."user_id"
  ) THEN
    RAISE EXCEPTION 'Book and tag must belong to the same user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

DROP TRIGGER IF EXISTS book_tags_owner_guard ON "book_tags";--> statement-breakpoint
CREATE TRIGGER book_tags_owner_guard
BEFORE INSERT OR UPDATE ON "book_tags"
FOR EACH ROW EXECUTE FUNCTION enforce_book_tag_ownership();
