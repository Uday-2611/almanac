import { getCurrentUser } from "@/lib/auth/session";
import { removeBookFromListForUser } from "@/lib/db/queries/books";
import { idSchema } from "@/lib/validation";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listId: string; bookId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { listId, bookId } = await params;
  if (!idSchema.safeParse(listId).success || !idSchema.safeParse(bookId).success) {
    return Response.json({ error: "List item not found." }, { status: 404 });
  }

  const removed = await removeBookFromListForUser(user.id, listId, bookId);
  return removed ? new Response(null, { status: 204 }) : Response.json({ error: "List item not found." }, { status: 404 });
}
