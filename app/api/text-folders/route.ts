import { getCurrentUser } from "@/lib/auth/session";
import { createTextFolderForUser, listTextFoldersForUser, TextFolderEligibilityError } from "@/lib/db/queries/texts";
import { createTextFolderSchema, validationErrorMessage } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ folders: await listTextFoldersForUser(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createTextFolderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: validationErrorMessage(parsed.error, "Enter a valid folder name.") }, { status: 400 });
  try {
    const folder = await createTextFolderForUser(user.id, parsed.data.name, parsed.data.noteIds);
    return folder
      ? Response.json({ folder }, { status: 201 })
      : Response.json({ error: "You already have a folder with that name." }, { status: 409 });
  } catch (error) {
    if (error instanceof TextFolderEligibilityError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
