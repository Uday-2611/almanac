import { getCurrentUser } from "@/lib/auth/session";
import { removeTagFromMovieForUser } from "@/lib/db/queries/tags";
import { idSchema } from "@/lib/validation";

type Context = { params: Promise<{ movieId: string; tagId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId, tagId } = await params;
  if (!idSchema.safeParse(movieId).success || !idSchema.safeParse(tagId).success) {
    return Response.json({ error: "Tag attachment not found." }, { status: 404 });
  }
  const owned = await removeTagFromMovieForUser(user.id, movieId, tagId);
  return owned ? new Response(null, { status: 204 }) : Response.json({ error: "Title not found." }, { status: 404 });
}
