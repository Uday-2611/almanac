import { getCurrentUser } from "@/lib/auth/session";
import { searchTmdbTitles, TmdbConfigurationError } from "@/lib/providers/tmdb";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ results: [] });

  try {
    return Response.json({ results: await searchTmdbTitles(query) });
  } catch (error) {
    if (error instanceof TmdbConfigurationError) {
      return Response.json({ error: "TMDB_API_READ_TOKEN is not configured." }, { status: 503 });
    }
    console.error("TMDB search failed", error);
    return Response.json({ error: "TMDB could not be reached. Try the search again." }, { status: 502 });
  }
}
