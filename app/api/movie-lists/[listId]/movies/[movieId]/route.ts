import { getCurrentUser } from "@/lib/auth/session";
import { removeMovieFromListForUser } from "@/lib/db/queries/movies";
import { idSchema } from "@/lib/validation";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listId: string; movieId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { listId, movieId } = await params;
  if (!idSchema.safeParse(listId).success || !idSchema.safeParse(movieId).success) {
    return Response.json({ error: "List item not found." }, { status: 404 });
  }
  const removed = await removeMovieFromListForUser(user.id, listId, movieId);
  return removed ? new Response(null, { status: 204 }) : Response.json({ error: "List item not found." }, { status: 404 });
}
