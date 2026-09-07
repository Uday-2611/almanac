import "server-only";

import { headers } from "next/headers";

import { getAuth } from "@/lib/auth/server";
import type { SessionUser } from "@/lib/types/auth";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });

  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || null,
  };
}
