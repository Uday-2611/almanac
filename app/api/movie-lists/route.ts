import { getCurrentUser } from "@/lib/auth/session";
import { createMovieListForUser, listMovieListsForUser } from "@/lib/db/queries/movies";
import { createMovieListSchema, validationErrorMessage } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ lists: await listMovieListsForUser(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createMovieListSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: validationErrorMessage(parsed.error, "Enter a valid list name.") }, { status: 400 });

  const result = await createMovieListForUser(user.id, parsed.data.name);
  if (!result.created) return Response.json({ error: "You already have a list with that name." }, { status: 409 });
  return Response.json({ list: result.list }, { status: 201 });
}
