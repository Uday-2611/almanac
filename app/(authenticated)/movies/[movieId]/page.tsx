import { notFound } from "next/navigation";

import { MediaInfoCard, type MediaInfo } from "@/components/media/media-info-card";
import { MovieEntryControls } from "@/components/movies/movie-entry-controls";
import { getCurrentUser } from "@/lib/auth/session";
import { getMovieForUser, listIdsForMovie, listMovieListOptionsForUser } from "@/lib/db/queries/movies";
import { idSchema } from "@/lib/validation";

function formatLoggedDate(value: string | null) {
  if (!value) return "Not logged";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export async function getMovieInfo(movieId: string) {
  if (!idSchema.safeParse(movieId).success) notFound();
  const user = await getCurrentUser();
  if (!user) notFound();

  const [movie, lists, selectedListIds] = await Promise.all([
    getMovieForUser(user.id, movieId),
    listMovieListOptionsForUser(user.id),
    listIdsForMovie(user.id, movieId),
  ]);
  if (!movie) notFound();

  const isTv = movie.mediaType === "tv";
  const info: MediaInfo = {
    kind: isTv ? "TV Show" : "Movie",
    title: movie.title,
    creator: movie.creator ?? (isTv ? "Creator unavailable" : "Director unavailable"),
    creatorLabel: isTv ? "Created by" : "Director",
    year: movie.releaseDate?.slice(0, 4) ?? "Unknown",
    rating: movie.rating,
    review: movie.review ?? "No review has been written yet.",
    loggedAt: formatLoggedDate(movie.loggedDate),
    tags: [],
    peopleLabel: "Cast",
    people: movie.cast.length ? movie.cast : ["Cast information is unavailable."],
    posterUrl: movie.posterUrl,
    overview: movie.overview,
  };

  return {
    info,
    controls: {
      cast: info.people,
      creator: info.creator,
      mediaType: movie.mediaType,
      movieId: movie.id,
      overview: info.overview,
      status: movie.status,
      title: info.title,
      year: info.year,
      rating: movie.rating,
      review: movie.review,
      loggedDate: movie.loggedDate,
      lists: lists.map((list) => ({ id: list.id, name: list.name })),
      selectedListIds,
    },
  };
}

export default async function MovieDetailPage({ params }: PageProps<"/movies/[movieId]">) {
  const { movieId } = await params;
  const { info, controls } = await getMovieInfo(movieId);

  return <MediaInfoCard info={info} backHref="/movies" actions={<MovieEntryControls key={controls.selectedListIds.join(":")} {...controls} />} />;
}
