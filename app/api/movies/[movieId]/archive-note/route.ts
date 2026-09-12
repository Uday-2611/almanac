import { getCurrentUser } from "@/lib/auth/session";
import { updateMovieArchiveNoteForUser } from "@/lib/db/queries/movies";
import { archiveNoteSchema, idSchema } from "@/lib/validation";

type Context = { params: Promise<{ movieId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = archiveNoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The note is too long." }, { status: 400 });

  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) return Response.json({ error: "Title not found." }, { status: 404 });
  const updated = await updateMovieArchiveNoteForUser(user.id, movieId, parsed.data.note);
  return updated ? Response.json({ archiveNote: updated.archiveNote }) : Response.json({ error: "Title not found." }, { status: 404 });
}
