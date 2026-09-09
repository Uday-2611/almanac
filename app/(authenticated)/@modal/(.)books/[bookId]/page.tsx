import { getBookInfo } from "@/app/(authenticated)/books/[bookId]/page";
import { BookEntryControls } from "@/components/books/book-entry-controls";
import { MediaInfoPanel } from "@/components/media/media-info-card";
import { MediaModal } from "@/components/media/media-modal";

export default async function InterceptedBookDetail({ params }: PageProps<"/books/[bookId]">) {
  const { bookId } = await params;
  const { info, controls } = await getBookInfo(bookId);

  return (
    <MediaModal label={`${info.title} details`}>
      <MediaInfoPanel info={info} actions={<BookEntryControls key={controls.selectedListIds.join(":")} {...controls} />} />
    </MediaModal>
  );
}
