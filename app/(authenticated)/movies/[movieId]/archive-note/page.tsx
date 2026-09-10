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

  return <ArchiveNotePage backHref={`/movies/${movie.id}`} backLabel="Movie" creator={movie.director ?? "Director unavailable"} kind="Movie" title={movie.title} year={year} />;
}
