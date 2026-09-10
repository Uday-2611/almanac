import { getCurrentUser } from "@/lib/auth/session";
import { getGoogleBooksVolume, GoogleBooksError, GoogleBooksNotFoundError } from "@/lib/providers/google-books";
import { getOpenLibraryBook, OpenLibraryError, OpenLibraryNotFoundError } from "@/lib/providers/books";
import { createBookSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const parsed = createBookSchema.safeParse({
    provider: url.searchParams.get("provider"),
    providerId: url.searchParams.get("providerId"),
  });
  if (!parsed.success) return Response.json({ error: "Invalid book data." }, { status: 400 });

  try {
    const book = parsed.data.provider === "open_library"
      ? await getOpenLibraryBook(parsed.data.providerId)
      : await getGoogleBooksVolume(parsed.data.providerId);

    return Response.json({
      preview: {
        artwork: book.coverUrl,
        creator: book.authorNames.join(", ") || "Author unavailable",
        details: book.pageCount ? [`${book.pageCount} pages`] : [],
        kind: "book" as const,
        overview: book.description,
        people: book.contributors,
        title: book.title,
        year: book.publishDate?.slice(0, 4) ?? String(book.publishYear ?? "Unknown"),
      },
    });
  } catch (error) {
    if (error instanceof OpenLibraryNotFoundError || error instanceof GoogleBooksNotFoundError) {
      return Response.json({ error: "Book information was not found." }, { status: 404 });
    }
    console.error("Book preview failed", error);
    const timedOut = (error instanceof OpenLibraryError || error instanceof GoogleBooksError) && error.code === "timeout";
    return Response.json({ error: timedOut ? "Book information took too long to respond." : "Book information is temporarily unavailable." }, { status: 502 });
  }
}
