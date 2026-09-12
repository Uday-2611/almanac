import { getCurrentUser } from "@/lib/auth/session";
import { removeTagFromBookForUser } from "@/lib/db/queries/tags";
import { idSchema } from "@/lib/validation";

type Context = { params: Promise<{ bookId: string; tagId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, tagId } = await params;
  if (!idSchema.safeParse(bookId).success || !idSchema.safeParse(tagId).success) {
    return Response.json({ error: "Tag attachment not found." }, { status: 404 });
  }
  const owned = await removeTagFromBookForUser(user.id, bookId, tagId);
  return owned ? new Response(null, { status: 204 }) : Response.json({ error: "Book not found." }, { status: 404 });
}
