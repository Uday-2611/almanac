export const MAX_IMPORT_ITEMS = 10_000;
export const MAX_IMPORT_BATCH_SIZE = 20;
export const LETTERBOXD_IMPORT_BATCH_SIZE = 5;
export const GOODREADS_IMPORT_BATCH_SIZE = 5;

export type LetterboxdImportStatus = "watchlist" | "watched";
export type GoodreadsImportStatus = "want_to_read" | "read";

export type LetterboxdImportItem = {
  clientId: string;
  source: "letterboxd";
  status: LetterboxdImportStatus;
  title: string;
  year: string | null;
};

export type GoodreadsImportItem = {
  authors: string[];
  clientId: string;
  goodreadsBookId: string;
  isbn: string | null;
  isbn13: string | null;
  pageCount: number | null;
  publishYear: number | null;
  source: "goodreads";
  status: GoodreadsImportStatus;
  title: string;
};

export type MediaImportItem = LetterboxdImportItem | GoodreadsImportItem;

export type ParsedMediaImport = {
  counts: Record<string, number>;
  ignoredCount: number;
  items: MediaImportItem[];
  source: MediaImportItem["source"];
};

export type ImportIssue = {
  clientId: string;
  reason: string;
  title: string;
};

export type ImportBatchResult = {
  created: number;
  issues: ImportIssue[];
  promoted: number;
  unchanged: number;
};
