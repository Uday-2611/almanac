import { getCurrentUser } from "@/lib/auth/session";
import { createBookListForUser, listBookListsForUser } from "@/lib/db/queries/books";
import { createBookListSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ lists: await listBookListsForUser(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createBookListSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "List names must be between 1 and 100 characters." }, { status: 400 });

  const list = await createBookListForUser(user.id, parsed.data.name);
  return Response.json({ list }, { status: 201 });
}
