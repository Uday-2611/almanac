import { getCurrentUser } from "@/lib/auth/session";
import { deleteMovieForUser, getMovieForUser, updateMovieForUser } from "@/lib/db/queries/movies";
import { idSchema, updateMovieSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ movieId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) return Response.json({ error: "Movie not found." }, { status: 404 });
  const movie = await getMovieForUser(user.id, movieId);
  return movie ? Response.json({ movie }) : Response.json({ error: "Movie not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateMovieSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid movie update." }, { status: 400 });

  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) return Response.json({ error: "Movie not found." }, { status: 404 });
  const movie = await updateMovieForUser(user.id, movieId, parsed.data);
  return movie ? Response.json({ movie }) : Response.json({ error: "Movie not found." }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) return Response.json({ error: "Movie not found." }, { status: 404 });
  const deleted = await deleteMovieForUser(user.id, movieId);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "Movie not found." }, { status: 404 });
}
