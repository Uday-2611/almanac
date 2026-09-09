import { getCurrentUser } from "@/lib/auth/session";
import { deleteBookForUser, getBookForUser, updateBookForUser } from "@/lib/db/queries/books";
import { idSchema, updateBookSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ bookId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  if (!idSchema.safeParse(bookId).success) return Response.json({ error: "Book not found." }, { status: 404 });
  const book = await getBookForUser(user.id, bookId);
  return book ? Response.json({ book }) : Response.json({ error: "Book not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateBookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid book update." }, { status: 400 });

  const { bookId } = await params;
  if (!idSchema.safeParse(bookId).success) return Response.json({ error: "Book not found." }, { status: 404 });
  const book = await updateBookForUser(user.id, bookId, parsed.data);
  return book ? Response.json({ book }) : Response.json({ error: "Book not found." }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  if (!idSchema.safeParse(bookId).success) return Response.json({ error: "Book not found." }, { status: 404 });
  const deleted = await deleteBookForUser(user.id, bookId);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "Book not found." }, { status: 404 });
}
