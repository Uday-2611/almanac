import { getCurrentUser } from "@/lib/auth/session";
import { getTmdbTitle, TmdbConfigurationError } from "@/lib/providers/tmdb";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const tmdbId = Number(url.searchParams.get("tmdbId"));
  const mediaType = url.searchParams.get("mediaType");
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || (mediaType !== "movie" && mediaType !== "tv")) {
    return Response.json({ error: "Invalid TMDB title." }, { status: 400 });
  }

  try {
    const movie = await getTmdbTitle(tmdbId, mediaType);
    return Response.json({
      preview: {
        artwork: movie.posterUrl,
        creator: movie.creator ?? (mediaType === "tv" ? "Creator unavailable" : "Director unavailable"),
        details: [mediaType === "tv" ? "TV series" : "Movie", ...(movie.runtimeMinutes ? [`${movie.runtimeMinutes} minutes`] : [])],
        kind: mediaType,
        overview: movie.overview || null,
        people: movie.cast,
        title: movie.title,
        year: movie.year,
      },
    });
  } catch (error) {
    if (error instanceof TmdbConfigurationError) {
      return Response.json({ error: "Movie and TV information is not configured." }, { status: 503 });
    }
    console.error("TMDB preview failed", error);
    return Response.json({ error: "Movie and TV information is temporarily unavailable." }, { status: 502 });
  }
}
