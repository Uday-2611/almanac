import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. Pull the Neon environment variables before using the database.");
  }

  return drizzle(neon(databaseUrl), { schema });
}

export type Database = ReturnType<typeof createDatabase>;

let database: Database | null = null;

export function getDatabase() {
  database ??= createDatabase();
  return database;
}
