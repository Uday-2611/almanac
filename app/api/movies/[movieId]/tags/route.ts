import { getCurrentUser } from "@/lib/auth/session";
import { attachTagToMovieForUser } from "@/lib/db/queries/tags";
import { createTagSchema, idSchema } from "@/lib/validation";

type Context = { params: Promise<{ movieId: string }> };

export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createTagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a tag name up to 64 characters." }, { status: 400 });

  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) return Response.json({ error: "Title not found." }, { status: 404 });
  const tag = await attachTagToMovieForUser(user.id, movieId, parsed.data.name);
  return tag ? Response.json({ tag }, { status: 201 }) : Response.json({ error: "Title not found." }, { status: 404 });
}
