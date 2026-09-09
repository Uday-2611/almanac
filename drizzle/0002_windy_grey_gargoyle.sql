CREATE TABLE "book_list_items" (
	"list_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_list_items_list_id_book_id_pk" PRIMARY KEY("list_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "book_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_list_items" ADD CONSTRAINT "book_list_items_list_id_book_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."book_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_list_items" ADD CONSTRAINT "book_list_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_lists" ADD CONSTRAINT "book_lists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_list_items_book_id_idx" ON "book_list_items" USING btree ("book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "book_lists_user_name_idx" ON "book_lists" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "book_lists_user_id_idx" ON "book_lists" USING btree ("user_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_read_book_list_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	list_user_id text;
	book_user_id text;
	book_state book_status;
BEGIN
	SELECT "user_id" INTO list_user_id FROM "book_lists" WHERE "id" = NEW."list_id";
	SELECT "user_id", "status" INTO book_user_id, book_state FROM "books" WHERE "id" = NEW."book_id";

	IF list_user_id IS NULL OR book_user_id IS NULL OR list_user_id <> book_user_id THEN
		RAISE EXCEPTION 'Book and list must belong to the same user' USING ERRCODE = '23514';
	END IF;

	IF book_state <> 'read' THEN
		RAISE EXCEPTION 'Only read books can be added to custom lists' USING ERRCODE = '23514';
	END IF;

	RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "book_list_items_read_only"
BEFORE INSERT OR UPDATE ON "book_list_items"
FOR EACH ROW EXECUTE FUNCTION enforce_read_book_list_item();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION remove_unread_book_list_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF OLD."status" = 'read' AND NEW."status" = 'want_to_read' THEN
		DELETE FROM "book_list_items" WHERE "book_id" = NEW."id";
	END IF;

	RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "books_remove_list_items_when_unread"
AFTER UPDATE OF "status" ON "books"
FOR EACH ROW EXECUTE FUNCTION remove_unread_book_list_items();
