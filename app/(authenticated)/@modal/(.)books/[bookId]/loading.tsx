import { MediaModal } from "@/components/media/media-modal";
import { MediaInfoSkeleton } from "@/components/states/media-info-skeleton";

export default function BookModalLoading() {
  return (
    <MediaModal label="Loading book details" tone="light">
      <MediaInfoSkeleton label="Loading book details" />
    </MediaModal>
  );
}
