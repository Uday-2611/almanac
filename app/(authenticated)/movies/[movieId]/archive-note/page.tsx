import { notFound } from "next/navigation";

import { ArchiveNotePage } from "@/components/media/archive-note-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getMovieForUser } from "@/lib/db/queries/movies";
import { idSchema } from "@/lib/validation";

export default async function MovieArchiveNotePage({ params }: PageProps<"/movies/[movieId]/archive-note">) {
  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const movie = await getMovieForUser(user.id, movieId);
  if (!movie) notFound();

  const year = movie.releaseDate?.slice(0, 4) ?? "Year unknown";

  const isTv = movie.mediaType === "tv";
  return <ArchiveNotePage backHref={`/movies/${movie.id}`} backLabel={isTv ? "TV Show" : "Movie"} creator={movie.creator ?? (isTv ? "Creator unavailable" : "Director unavailable")} kind={isTv ? "TV Show" : "Movie"} title={movie.title} year={year} />;
}
