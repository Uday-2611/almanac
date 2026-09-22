import { getCurrentUser } from "@/lib/auth/session";
import { listMovieSearchStatusesForUser } from "@/lib/db/queries/movies";
import { searchTmdbTitles, TmdbConfigurationError } from "@/lib/providers/tmdb";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ results: [] });
  if (query.length > 160) return Response.json({ error: "Search terms must be 160 characters or fewer." }, { status: 400 });

  try {
    const results = await searchTmdbTitles(query);
    const savedTitles = await listMovieSearchStatusesForUser(user.id, results);

    return Response.json({
      results: results.map((result) => {
        const saved = savedTitles.find((movie) => (
          movie.tmdbId === result.tmdbId && movie.mediaType === result.mediaType
        ));

        return {
          ...result,
          savedEntryId: saved?.id ?? null,
          savedStatus: saved?.status ?? null,
        };
      }),
    });
  } catch (error) {
    if (error instanceof TmdbConfigurationError) {
      return Response.json({ error: "TMDB_API_READ_TOKEN is not configured." }, { status: 503 });
    }
    console.error("TMDB search failed", error);
    return Response.json({ error: "TMDB could not be reached. Try the search again." }, { status: 502 });
  }
}
