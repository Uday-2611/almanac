import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ...timestamps,
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const movieStatus = pgEnum("movie_status", ["watchlist", "watched"]);
export const bookStatus = pgEnum("book_status", ["want_to_read", "read"]);
export const bookProvider = pgEnum("book_provider", ["open_library", "google_books"]);
export const mediaSection = pgEnum("media_section", ["movies", "books"]);
export const viewMode = pgEnum("view_mode", ["list", "images"]);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    title: text("title").notNull(),
    director: text("director"),
    overview: text("overview"),
    posterUrl: text("poster_url"),
    backdropUrl: text("backdrop_url"),
    releaseDate: date("release_date", { mode: "string" }),
    runtimeMinutes: integer("runtime_minutes"),
    cast: jsonb("cast").$type<string[]>().default([]).notNull(),
    status: movieStatus("status").default("watchlist").notNull(),
    rating: integer("rating"),
    review: text("review"),
    reviewFormat: text("review_format").default("markdown").notNull(),
    loggedDate: date("logged_date", { mode: "string" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("movies_user_tmdb_idx").on(table.userId, table.tmdbId),
    index("movies_user_status_idx").on(table.userId, table.status),
    check("movies_rating_range", sql`${table.rating} is null or ${table.rating} between 1 and 5`),
  ],
);

export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    provider: bookProvider("provider").default("open_library").notNull(),
    providerId: text("provider_id").notNull(),
    title: text("title").notNull(),
    authors: jsonb("authors").$type<string[]>().default([]).notNull(),
    contributors: jsonb("contributors").$type<string[]>().default([]).notNull(),
    description: text("description"),
    coverUrl: text("cover_url"),
    publishDate: date("publish_date", { mode: "string" }),
    pageCount: integer("page_count"),
    status: bookStatus("status").default("want_to_read").notNull(),
    rating: integer("rating"),
    review: text("review"),
    reviewFormat: text("review_format").default("markdown").notNull(),
    loggedDate: date("logged_date", { mode: "string" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("books_user_provider_idx").on(table.userId, table.provider, table.providerId),
    index("books_user_status_idx").on(table.userId, table.status),
    check("books_rating_range", sql`${table.rating} is null or ${table.rating} between 1 and 5`),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("tags_user_normalized_name_idx").on(table.userId, table.normalizedName)],
);

export const movieTags = pgTable(
  "movie_tags",
  {
    movieId: uuid("movie_id").notNull().references(() => movies.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.movieId, table.tagId] }), index("movie_tags_tag_id_idx").on(table.tagId)],
);

export const movieLists = pgTable(
  "movie_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("movie_lists_user_name_idx").on(table.userId, table.name),
    index("movie_lists_user_id_idx").on(table.userId),
  ],
);

export const movieListItems = pgTable(
  "movie_list_items",
  {
    listId: uuid("list_id").notNull().references(() => movieLists.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id").notNull().references(() => movies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.movieId] }),
    index("movie_list_items_movie_id_idx").on(table.movieId),
  ],
);

export const bookLists = pgTable(
  "book_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("book_lists_user_name_idx").on(table.userId, table.name),
    index("book_lists_user_id_idx").on(table.userId),
  ],
);

export const bookListItems = pgTable(
  "book_list_items",
  {
    listId: uuid("list_id").notNull().references(() => bookLists.id, { onDelete: "cascade" }),
    bookId: uuid("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.bookId] }),
    index("book_list_items_book_id_idx").on(table.bookId),
  ],
);

export const bookTags = pgTable(
  "book_tags",
  {
    bookId: uuid("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.bookId, table.tagId] }), index("book_tags_tag_id_idx").on(table.tagId)],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    section: mediaSection("section").notNull(),
    viewMode: viewMode("view_mode").default("list").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("preferences_user_section_idx").on(table.userId, table.section)],
);
