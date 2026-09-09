import { getCurrentUser } from "@/lib/auth/session";
import { GoogleBooksError, searchGoogleBooks } from "@/lib/providers/google-books";
import { OpenLibraryError, searchOpenLibraryBooks } from "@/lib/providers/books";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ results: [] });
  const requestedProvider = new URL(request.url).searchParams.get("provider");

  if (requestedProvider !== "google_books") {
    try {
      const books = await searchOpenLibraryBooks(query);
      if (books.length) return Response.json({
        results: books.map((book) => ({
          provider: "open_library" as const,
          providerId: book.openLibraryWorkId,
          title: book.title,
          authors: book.authorNames,
          year: book.publishYear,
          coverUrl: book.coverUrl,
        })),
      });
    } catch (error) {
      console.warn("Open Library search unavailable; trying Google Books.", error instanceof OpenLibraryError ? error.message : error);
    }
  }

  try {
    const books = await searchGoogleBooks(query);
    return Response.json({
      results: books.map((book) => ({
        provider: "google_books" as const,
        providerId: book.googleBooksVolumeId,
        title: book.title,
        authors: book.authorNames,
        year: book.publishYear,
        coverUrl: book.coverUrl,
      })),
    });
  } catch (error) {
    console.error("Google Books fallback search failed", error);
    const message = error instanceof GoogleBooksError && error.code === "timeout"
      ? "Both book databases took too long to respond. Try again."
      : "Book search is temporarily unavailable.";
    return Response.json({ error: message }, { status: 502 });
  }
}
