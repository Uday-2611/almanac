export type TextDraftSnapshot = {
  noteId: string;
  title: string;
  body: string;
  journalDate: string;
  folderIds: string[];
  revision: number;
  changedAt: string;
  confirmedUpdatedAt: string | null;
};

export function textDraftStorageKey(userId: string, noteId: string) {
  return `almanac:text-draft:v1:${userId}:${noteId}`;
}

export function shouldOfferTextDraftRecovery(draft: TextDraftSnapshot | null, server: {
  id: string;
  clientRevision: number;
  updatedAt: string;
} | null) {
  if (!draft || (server && draft.noteId !== server.id)) return false;
  if (!server) return true;
  return draft.revision > server.clientRevision
    || new Date(draft.changedAt).getTime() > new Date(server.updatedAt).getTime();
}

export function nextTextRevision(currentRevision: number, confirmedRevision: number) {
  return Math.max(currentRevision, confirmedRevision) + 1;
}

export function textDraftFingerprint(draft: Pick<TextDraftSnapshot, "title" | "body" | "journalDate" | "folderIds" | "revision">) {
  return JSON.stringify([draft.title, draft.body, draft.journalDate, [...draft.folderIds].sort(), draft.revision]);
}

export function canClearLocalTextDraft(saved: TextDraftSnapshot, current: TextDraftSnapshot, requestSucceeded: boolean) {
  return requestSucceeded && textDraftFingerprint(saved) === textDraftFingerprint(current);
}

export function parseTextDraft(value: string | null): TextDraftSnapshot | null {
  if (!value) return null;
  try {
    const draft = JSON.parse(value) as Partial<TextDraftSnapshot>;
    if (
      typeof draft.noteId !== "string"
      || typeof draft.title !== "string"
      || typeof draft.body !== "string"
      || !/^\d{4}-\d{2}-\d{2}$/.test(draft.journalDate ?? "")
      || !Array.isArray(draft.folderIds)
      || !draft.folderIds.every((id) => typeof id === "string")
      || !Number.isInteger(draft.revision)
      || typeof draft.changedAt !== "string"
      || (draft.confirmedUpdatedAt !== null && typeof draft.confirmedUpdatedAt !== "string")
    ) return null;
    return draft as TextDraftSnapshot;
  } catch {
    return null;
  }
}
