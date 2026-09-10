import { MediaModal } from "@/components/media/media-modal";
import { MediaInfoSkeleton } from "@/components/states/media-info-skeleton";

export default function MovieModalLoading() {
  return (
    <MediaModal label="Loading movie details" tone="light">
      <MediaInfoSkeleton label="Loading movie details" />
    </MediaModal>
  );
}
