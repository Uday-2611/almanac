export type EntryStatus = "planned" | "completed";

export type MediaEntry = { id: string; userId: string; title: string; status: EntryStatus; rating: number | null; reviewMarkdown: string | null; tags: string[] };

export type MovieEntry = MediaEntry & { kind: "movie"; tmdbId: number };
export type BookEntry = MediaEntry & { kind: "book"; providerId: string };
