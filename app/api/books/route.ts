import { getCurrentUser } from "@/lib/auth/session";
import { createBookForUser, getBookByProviderId, listBooksForUser } from "@/lib/db/queries/books";
import { BookMetadataError, getBookProviderMetadata } from "@/lib/providers/book-metadata";
import { createBookSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requestedStatus = new URL(request.url).searchParams.get("status");
  const status = requestedStatus === "want_to_read" ? "want_to_read" : "read";
  return Response.json({ books: await listBooksForUser(user.id, status) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createBookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid book data." }, { status: 400 });

  try {
    const existing = await getBookByProviderId(user.id, parsed.data.provider, parsed.data.providerId);
    if (existing) return Response.json({ book: existing, created: false });

    const metadata = await getBookProviderMetadata(parsed.data);
    const result = await createBookForUser(user.id, metadata, parsed.data.status);
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof BookMetadataError && error.code === "not_found") {
      return Response.json({ error: "Book not found." }, { status: 404 });
    }
    console.error("[api/books] Provider lookup failed while adding a book.", {
      code: error instanceof BookMetadataError ? error.code : "unexpected",
      provider: parsed.data.provider,
      providerId: parsed.data.providerId,
    });
    const message = error instanceof BookMetadataError && error.code === "timeout"
      ? "The book database took too long to respond. Try again."
      : "The book could not be added.";
    return Response.json({ error: message }, { status: 502 });
  }
}
