CREATE TABLE "movie_list_items" (
	"list_id" uuid NOT NULL,
	"movie_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movie_list_items_list_id_movie_id_pk" PRIMARY KEY("list_id","movie_id")
);
--> statement-breakpoint
CREATE TABLE "movie_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movie_list_items" ADD CONSTRAINT "movie_list_items_list_id_movie_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."movie_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_list_items" ADD CONSTRAINT "movie_list_items_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_lists" ADD CONSTRAINT "movie_lists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movie_list_items_movie_id_idx" ON "movie_list_items" USING btree ("movie_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_lists_user_name_idx" ON "movie_lists" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "movie_lists_user_id_idx" ON "movie_lists" USING btree ("user_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_watched_movie_list_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	list_user_id text;
	movie_user_id text;
	movie_state movie_status;
BEGIN
	SELECT "user_id" INTO list_user_id FROM "movie_lists" WHERE "id" = NEW."list_id";
	SELECT "user_id", "status" INTO movie_user_id, movie_state FROM "movies" WHERE "id" = NEW."movie_id";

	IF list_user_id IS NULL OR movie_user_id IS NULL OR list_user_id <> movie_user_id THEN
		RAISE EXCEPTION 'Movie and list must belong to the same user' USING ERRCODE = '23514';
	END IF;

	IF movie_state <> 'watched' THEN
		RAISE EXCEPTION 'Only watched movies can be added to custom lists' USING ERRCODE = '23514';
	END IF;

	RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "movie_list_items_watched_only"
BEFORE INSERT OR UPDATE ON "movie_list_items"
FOR EACH ROW EXECUTE FUNCTION enforce_watched_movie_list_item();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION remove_unwatched_movie_list_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF OLD."status" = 'watched' AND NEW."status" = 'watchlist' THEN
		DELETE FROM "movie_list_items" WHERE "movie_id" = NEW."id";
	END IF;

	RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "movies_remove_list_items_when_unwatched"
AFTER UPDATE OF "status" ON "movies"
FOR EACH ROW EXECUTE FUNCTION remove_unwatched_movie_list_items();
