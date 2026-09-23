import { getCurrentUser } from "@/lib/auth/session";
import { deleteTextFolderForUser, renameTextFolderForUser } from "@/lib/db/queries/texts";
import { idSchema, updateTextFolderSchema, validationErrorMessage } from "@/lib/validation";

type RouteContext = { params: Promise<{ folderId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { folderId } = await params;
  if (!idSchema.safeParse(folderId).success) return Response.json({ error: "Folder not found." }, { status: 404 });
  const parsed = updateTextFolderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: validationErrorMessage(parsed.error, "Enter a valid folder name.") }, { status: 400 });
  try {
    const folder = await renameTextFolderForUser(user.id, folderId, parsed.data.name);
    return folder ? Response.json({ folder }) : Response.json({ error: "Folder not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return Response.json({ error: "You already have a folder with that name." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { folderId } = await params;
  if (!idSchema.safeParse(folderId).success) return Response.json({ error: "Folder not found." }, { status: 404 });
  const deleted = await deleteTextFolderForUser(user.id, folderId);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "Folder not found." }, { status: 404 });
}
