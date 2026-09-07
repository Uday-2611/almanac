CREATE TYPE "public"."book_provider" AS ENUM('open_library', 'google_books');--> statement-breakpoint
CREATE TYPE "public"."book_status" AS ENUM('want_to_read', 'read');--> statement-breakpoint
CREATE TYPE "public"."media_section" AS ENUM('movies', 'books');--> statement-breakpoint
CREATE TYPE "public"."movie_status" AS ENUM('watchlist', 'watched');--> statement-breakpoint
CREATE TYPE "public"."view_mode" AS ENUM('list', 'images');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_tags" (
	"book_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_tags_book_id_tag_id_pk" PRIMARY KEY("book_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" "book_provider" DEFAULT 'open_library' NOT NULL,
	"provider_id" text NOT NULL,
	"title" text NOT NULL,
	"authors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contributors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"cover_url" text,
	"publish_date" date,
	"page_count" integer,
	"status" "book_status" DEFAULT 'want_to_read' NOT NULL,
	"rating" integer,
	"review" text,
	"review_format" text DEFAULT 'markdown' NOT NULL,
	"logged_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_rating_range" CHECK ("books"."rating" is null or "books"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "movie_tags" (
	"movie_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movie_tags_movie_id_tag_id_pk" PRIMARY KEY("movie_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" integer NOT NULL,
	"title" text NOT NULL,
	"director" text,
	"overview" text,
	"poster_url" text,
	"backdrop_url" text,
	"release_date" date,
	"runtime_minutes" integer,
	"cast" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "movie_status" DEFAULT 'watchlist' NOT NULL,
	"rating" integer,
	"review" text,
	"review_format" text DEFAULT 'markdown' NOT NULL,
	"logged_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_rating_range" CHECK ("movies"."rating" is null or "movies"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"section" "media_section" NOT NULL,
	"view_mode" "view_mode" DEFAULT 'list' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_tags" ADD CONSTRAINT "book_tags_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_tags" ADD CONSTRAINT "book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_tags" ADD CONSTRAINT "movie_tags_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_tags" ADD CONSTRAINT "movie_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "book_tags_tag_id_idx" ON "book_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "books_user_provider_idx" ON "books" USING btree ("user_id","provider","provider_id");--> statement-breakpoint
CREATE INDEX "books_user_status_idx" ON "books" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "movie_tags_tag_id_idx" ON "movie_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movies_user_tmdb_idx" ON "movies" USING btree ("user_id","tmdb_id");--> statement-breakpoint
CREATE INDEX "movies_user_status_idx" ON "movies" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_normalized_name_idx" ON "tags" USING btree ("user_id","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "preferences_user_section_idx" ON "user_preferences" USING btree ("user_id","section");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");