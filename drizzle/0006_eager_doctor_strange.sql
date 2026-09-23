CREATE TABLE "text_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_note_folders" (
	"user_id" text NOT NULL,
	"note_id" uuid NOT NULL,
	"folder_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "text_note_folders_note_id_folder_id_pk" PRIMARY KEY("note_id","folder_id")
);
--> statement-breakpoint
CREATE TABLE "text_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"body" text DEFAULT '' NOT NULL,
	"journal_date" date NOT NULL,
	"client_revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "text_notes_revision_nonnegative" CHECK ("text_notes"."client_revision" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "text_folders_id_user_idx" ON "text_folders" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "text_notes_id_user_idx" ON "text_notes" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "text_folders" ADD CONSTRAINT "text_folders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_note_folders" ADD CONSTRAINT "text_note_folders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_note_folders" ADD CONSTRAINT "text_note_folders_note_owner_fk" FOREIGN KEY ("note_id","user_id") REFERENCES "public"."text_notes"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_note_folders" ADD CONSTRAINT "text_note_folders_folder_owner_fk" FOREIGN KEY ("folder_id","user_id") REFERENCES "public"."text_folders"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_notes" ADD CONSTRAINT "text_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "text_folders_user_normalized_name_idx" ON "text_folders" USING btree ("user_id","normalized_name");--> statement-breakpoint
CREATE INDEX "text_folders_user_id_idx" ON "text_folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "text_note_folders_user_note_idx" ON "text_note_folders" USING btree ("user_id","note_id");--> statement-breakpoint
CREATE INDEX "text_note_folders_user_folder_idx" ON "text_note_folders" USING btree ("user_id","folder_id");--> statement-breakpoint
CREATE INDEX "text_notes_user_journal_date_idx" ON "text_notes" USING btree ("user_id","journal_date");
