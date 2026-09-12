import { getCurrentUser } from "@/lib/auth/session";
import { createTagForUser, listTagsForUser } from "@/lib/db/queries/tags";
import { createTagSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ tags: await listTagsForUser(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createTagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a tag name up to 64 characters." }, { status: 400 });

  const result = await createTagForUser(user.id, parsed.data.name);
  return Response.json({ tag: result.tag }, { status: result.created ? 201 : 200 });
}
