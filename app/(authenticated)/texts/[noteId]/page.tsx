import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TextNoteEditor } from "@/components/texts/text-note-editor";
import { getCurrentUser } from "@/lib/auth/session";
import { getTextNoteForUser, listTextFoldersForUser } from "@/lib/db/queries/texts";
import { idSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Text note" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/texts") || value.startsWith("//") || value.includes("://")) return "/texts";
  return value;
}

export default async function TextNotePage({ params, searchParams }: PageProps<"/texts/[noteId]">) {
  const { noteId } = await params;
  if (!idSchema.safeParse(noteId).success) notFound();
  const user = await getCurrentUser();
  if (!user) notFound();
  const query = await searchParams;
  const [note, folders] = await Promise.all([
    getTextNoteForUser(user.id, noteId),
    listTextFoldersForUser(user.id),
  ]);

  return <TextNoteEditor
    folders={folders.map(({ id, name }) => ({ id, name }))}
    initialNote={note ? { ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() } : null}
    isNew={first(query.new) === "1"}
    noteId={noteId}
    returnTo={safeReturnTo(first(query.returnTo))}
    userId={user.id}
    userName={user.name?.trim() || user.email}
  />;
}
