import { getCurrentUser } from "@/lib/auth/session";
import { addMovieToListForUser, MovieListEligibilityError } from "@/lib/db/queries/movies";
import { idSchema, movieListItemSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = movieListItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid movie." }, { status: 400 });

  try {
    const { listId } = await params;
    if (!idSchema.safeParse(listId).success) return Response.json({ error: "List not found." }, { status: 404 });
    await addMovieToListForUser(user.id, listId, parsed.data.movieId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof MovieListEligibilityError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
