import { getCurrentUser } from "@/lib/auth/session";
import { addBookToListForUser, BookListEligibilityError } from "@/lib/db/queries/books";
import { bookListItemSchema, idSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bookListItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid book." }, { status: 400 });

  try {
    const { listId } = await params;
    if (!idSchema.safeParse(listId).success) return Response.json({ error: "List not found." }, { status: 404 });
    await addBookToListForUser(user.id, listId, parsed.data.bookId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof BookListEligibilityError) return Response.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
