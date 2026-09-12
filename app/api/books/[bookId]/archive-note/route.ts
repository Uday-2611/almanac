import { getCurrentUser } from "@/lib/auth/session";
import { updateBookArchiveNoteForUser } from "@/lib/db/queries/books";
import { archiveNoteSchema, idSchema } from "@/lib/validation";

type Context = { params: Promise<{ bookId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = archiveNoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The note is too long." }, { status: 400 });

  const { bookId } = await params;
  if (!idSchema.safeParse(bookId).success) return Response.json({ error: "Book not found." }, { status: 404 });
  const updated = await updateBookArchiveNoteForUser(user.id, bookId, parsed.data.note);
  return updated ? Response.json({ archiveNote: updated.archiveNote }) : Response.json({ error: "Book not found." }, { status: 404 });
}
