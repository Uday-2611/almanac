export function ReviewEditor({ defaultValue = "" }: { defaultValue?: string }) {
  return <textarea defaultValue={defaultValue} name="review" />;
}
