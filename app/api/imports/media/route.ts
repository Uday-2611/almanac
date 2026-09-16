import { getCurrentUser } from "@/lib/auth/session";
import { importGoodreadsBatch, importLetterboxdBatch } from "@/lib/imports/server";
import { mediaImportBatchSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

    const parsed = mediaImportBatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid import data." }, { status: 400 });

    const result = parsed.data.source === "letterboxd"
      ? await importLetterboxdBatch(user.id, parsed.data.items)
      : await importGoodreadsBatch(user.id, parsed.data.items);
    return Response.json(result);
  } catch (error) {
    console.error("[api/imports/media] Import request failed.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({
      error: "Almanac could not reach your library. Nothing from this batch was lost; please try again.",
      retryable: true,
    }, { status: 503 });
  }
}
