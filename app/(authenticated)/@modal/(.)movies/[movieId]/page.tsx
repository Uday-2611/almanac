import { getMovieInfo } from "@/app/(authenticated)/movies/[movieId]/page";
import { MediaInfoPanel } from "@/components/media/media-info-card";
import { MediaModal } from "@/components/media/media-modal";
import { MovieEntryControls } from "@/components/movies/movie-entry-controls";

export default async function InterceptedMovieDetail({ params }: PageProps<"/movies/[movieId]">) {
  const { movieId } = await params;
  const { info, controls } = await getMovieInfo(movieId);

  return (
    <MediaModal label={`${info.title} details`} tone="light">
      <MediaInfoPanel info={info} actions={<MovieEntryControls key={controls.selectedListIds.join(":")} {...controls} />} />
    </MediaModal>
  );
}
