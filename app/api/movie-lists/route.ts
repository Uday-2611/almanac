import { getCurrentUser } from "@/lib/auth/session";
import { createMovieListForUser, listMovieListsForUser } from "@/lib/db/queries/movies";
import { createMovieListSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ lists: await listMovieListsForUser(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createMovieListSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "List names must be between 1 and 100 characters." }, { status: 400 });

  const list = await createMovieListForUser(user.id, parsed.data.name);
  return Response.json({ list }, { status: 201 });
}
