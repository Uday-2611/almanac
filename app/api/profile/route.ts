import { eq } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { user as userTable } from "@/lib/db/schema";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Names cannot exceed 80 characters."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
}).strict();

function isUniqueEmailError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueEmailError(error.cause);
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Check your profile details." }, { status: 400 });
  }

  const emailChanged = parsed.data.email !== currentUser.email.toLowerCase();

  try {
    const [updatedUser] = await getDatabase()
      .update(userTable)
      .set({
        name: parsed.data.name,
        email: parsed.data.email,
        ...(emailChanged ? { emailVerified: false } : {}),
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, currentUser.id))
      .returning({ name: userTable.name, email: userTable.email });

    if (!updatedUser) return Response.json({ error: "This account could not be found." }, { status: 404 });
    return Response.json({ user: updatedUser });
  } catch (error) {
    if (isUniqueEmailError(error)) {
      return Response.json({ error: "That email address is already in use." }, { status: 409 });
    }
    return Response.json({ error: "Your profile could not be saved. Try again." }, { status: 500 });
  }
}
