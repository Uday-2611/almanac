import { getCurrentUser } from "@/lib/auth/session";
import { BookMetadataError, getBookProviderMetadata } from "@/lib/providers/book-metadata";
import { createBookSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const parsed = createBookSchema.safeParse({
    provider: url.searchParams.get("provider"),
    providerId: url.searchParams.get("providerId"),
    titleHint: url.searchParams.get("titleHint") ?? undefined,
    authorHints: url.searchParams.getAll("authorHint"),
  });
  if (!parsed.success) return Response.json({ error: "Invalid book data." }, { status: 400 });

  try {
    const book = await getBookProviderMetadata(parsed.data);

    return Response.json({
      preview: {
        artwork: book.coverUrl,
        creator: book.authors.join(", ") || "Author unavailable",
        details: book.pageCount ? [`${book.pageCount} pages`] : [],
        kind: "book" as const,
        overview: book.description,
        people: book.contributors,
        title: book.title,
        year: book.publishDate?.slice(0, 4) ?? "Unknown",
      },
    });
  } catch (error) {
    if (error instanceof BookMetadataError && error.code === "not_found") {
      return Response.json({ error: "Book information was not found." }, { status: 404 });
    }
    console.error("[api/books/preview] Provider lookup failed.", {
      code: error instanceof BookMetadataError ? error.code : "unexpected",
      provider: parsed.data.provider,
      providerId: parsed.data.providerId,
    });
    const timedOut = error instanceof BookMetadataError && error.code === "timeout";
    return Response.json({ error: timedOut ? "Book information took too long to respond." : "Book information is temporarily unavailable." }, { status: 502 });
  }
}
