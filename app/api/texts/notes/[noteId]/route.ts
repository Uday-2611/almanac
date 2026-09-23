import { getCurrentUser } from "@/lib/auth/session";
import { deleteTextNoteForUser, saveTextNoteForUser, StaleTextRevisionError, TextFolderEligibilityError } from "@/lib/db/queries/texts";
import { idSchema, saveTextNoteSchema, validationErrorMessage } from "@/lib/validation";

type RouteContext = { params: Promise<{ noteId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { noteId } = await params;
  if (!idSchema.safeParse(noteId).success) return Response.json({ error: "Note not found." }, { status: 404 });

  const parsed = saveTextNoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: validationErrorMessage(parsed.error, "Enter a valid note.") }, { status: 400 });
  }

  try {
    const note = await saveTextNoteForUser(user.id, noteId, parsed.data);
    return note
      ? Response.json({ note })
      : Response.json({ error: "Note not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof TextFolderEligibilityError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof StaleTextRevisionError) {
      return Response.json({ error: error.message, note: error.note }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { noteId } = await params;
  if (!idSchema.safeParse(noteId).success) return Response.json({ error: "Note not found." }, { status: 404 });
  const deleted = await deleteTextNoteForUser(user.id, noteId);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "Note not found." }, { status: 404 });
}
