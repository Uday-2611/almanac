import { getCurrentUser } from "@/lib/auth/session";
import { deleteMovieListForUser, renameMovieListForUser } from "@/lib/db/queries/movies";
import { idSchema, updateMovieListSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ listId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateMovieListSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "List names must be between 1 and 100 characters." }, { status: 400 });
  }

  const { listId } = await params;
  if (!idSchema.safeParse(listId).success) return Response.json({ error: "List not found." }, { status: 404 });

  try {
    const list = await renameMovieListForUser(user.id, listId, parsed.data.name);
    return list ? Response.json({ list }) : Response.json({ error: "List not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return Response.json({ error: "You already have a list with that name." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  if (!idSchema.safeParse(listId).success) return Response.json({ error: "List not found." }, { status: 404 });

  const deleted = await deleteMovieListForUser(user.id, listId);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "List not found." }, { status: 404 });
}
