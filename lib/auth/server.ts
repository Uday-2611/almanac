import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";

import { getDatabase } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

function getAllowedHosts() {
  return [
    "localhost:3000",
    "127.0.0.1:3000",
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((host): host is string => Boolean(host));
}

function createAuth() {
  return betterAuth({
    appName: "Almanac",
    baseURL: {
      allowedHosts: getAllowedHosts(),
      fallback: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      protocol: "auto",
    },
    database: drizzleAdapter(getDatabase(), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      trustedProxyHeaders: Boolean(process.env.VERCEL),
    },
  });
}

export type AlmanacAuth = ReturnType<typeof createAuth>;

let authInstance: AlmanacAuth | null = null;

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}
