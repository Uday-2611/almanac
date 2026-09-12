import { notFound } from "next/navigation";

import { ArchiveNotePage } from "@/components/media/archive-note-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getMovieForUser } from "@/lib/db/queries/movies";
import { listTagsForMovieForUser, listTagsForUser } from "@/lib/db/queries/tags";
import { idSchema } from "@/lib/validation";

export default async function MovieArchiveNotePage({ params }: PageProps<"/movies/[movieId]/archive-note">) {
  const { movieId } = await params;
  if (!idSchema.safeParse(movieId).success) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const [movie, tags, reusableTags] = await Promise.all([
    getMovieForUser(user.id, movieId),
    listTagsForMovieForUser(user.id, movieId),
    listTagsForUser(user.id),
  ]);
  if (!movie) notFound();

  const year = movie.releaseDate?.slice(0, 4) ?? "Year unknown";

  const isTv = movie.mediaType === "tv";
  return <ArchiveNotePage backHref={`/movies/${movie.id}`} backLabel={isTv ? "TV Show" : "Movie"} creator={movie.creator ?? (isTv ? "Creator unavailable" : "Director unavailable")} entryId={movie.id} entryType="movie" kind={isTv ? "TV Show" : "Movie"} note={movie.archiveNote} reusableTags={reusableTags} tags={tags} title={movie.title} year={year} />;
}
