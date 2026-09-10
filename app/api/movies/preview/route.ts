import { getCurrentUser } from "@/lib/auth/session";
import { getTmdbMovie, TmdbConfigurationError } from "@/lib/providers/tmdb";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tmdbId = Number(new URL(request.url).searchParams.get("tmdbId"));
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return Response.json({ error: "Invalid movie ID." }, { status: 400 });
  }

  try {
    const movie = await getTmdbMovie(tmdbId);
    return Response.json({
      preview: {
        artwork: movie.posterUrl,
        creator: movie.director ?? "Director unavailable",
        details: movie.runtimeMinutes ? [`${movie.runtimeMinutes} minutes`] : [],
        kind: "movie" as const,
        overview: movie.overview || null,
        people: movie.cast,
        title: movie.title,
        year: movie.year,
      },
    });
  } catch (error) {
    if (error instanceof TmdbConfigurationError) {
      return Response.json({ error: "Movie information is not configured." }, { status: 503 });
    }
    console.error("TMDB preview failed", error);
    return Response.json({ error: "Movie information is temporarily unavailable." }, { status: 502 });
  }
}
