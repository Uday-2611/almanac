import { getCurrentUser } from "@/lib/auth/session";
import { createBookForUser, getBookByProviderId, listBooksForUser } from "@/lib/db/queries/books";
import { getGoogleBooksVolume, GoogleBooksError, GoogleBooksNotFoundError } from "@/lib/providers/google-books";
import { getOpenLibraryBook, OpenLibraryError, OpenLibraryNotFoundError } from "@/lib/providers/books";
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

    const metadata = parsed.data.provider === "open_library"
      ? (() => getOpenLibraryBook(parsed.data.providerId).then((source) => ({
          provider: "open_library" as const,
          providerId: source.openLibraryWorkId,
          title: source.title,
          authors: source.authorNames,
          contributors: source.contributors,
          description: source.description,
          coverUrl: source.coverUrl,
          publishDate: source.publishDate,
          pageCount: source.pageCount,
        })))()
      : (() => getGoogleBooksVolume(parsed.data.providerId).then((source) => ({
          provider: "google_books" as const,
          providerId: source.googleBooksVolumeId,
          title: source.title,
          authors: source.authorNames,
          contributors: source.contributors,
          description: source.description,
          coverUrl: source.coverUrl,
          publishDate: source.publishDate,
          pageCount: source.pageCount,
        })))();
    const result = await createBookForUser(user.id, await metadata, parsed.data.status);
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof OpenLibraryNotFoundError || error instanceof GoogleBooksNotFoundError) {
      return Response.json({ error: "Book not found." }, { status: 404 });
    }
    console.error("Adding book failed", error);
    const message = (error instanceof OpenLibraryError || error instanceof GoogleBooksError) && error.code === "timeout"
      ? "The book database took too long to respond. Try again."
      : "The book could not be added.";
    return Response.json({ error: message }, { status: 502 });
  }
}
