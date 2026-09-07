import { getCurrentUser } from "@/lib/auth/session";
import { createMovieForUser, listMoviesForUser } from "@/lib/db/queries/movies";
import { getTmdbMovie, TmdbConfigurationError } from "@/lib/providers/tmdb";
import { createMovieSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requestedStatus = new URL(request.url).searchParams.get("status");
  const status = requestedStatus === "watchlist" ? "watchlist" : "watched";
  return Response.json({ movies: await listMoviesForUser(user.id, status) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createMovieSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid movie data." }, { status: 400 });

  try {
    const result = await createMovieForUser(user.id, await getTmdbMovie(parsed.data.tmdbId), parsed.data.status);
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof TmdbConfigurationError) {
      return Response.json({ error: "TMDB_API_READ_TOKEN is not configured." }, { status: 503 });
    }
    console.error("Adding movie failed", error);
    return Response.json({ error: "The movie could not be added." }, { status: 502 });
  }
}
