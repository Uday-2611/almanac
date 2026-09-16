import "server-only";

import { importGoodreadsBookForUser } from "@/lib/db/queries/books";
import { importMovieForUser } from "@/lib/db/queries/movies";
import { selectBookImportMatch, selectTmdbImportMatch } from "@/lib/imports/matching";
import type {
  GoodreadsImportItem,
  ImportBatchResult,
  LetterboxdImportItem,
} from "@/lib/imports/types";
import { getBookProviderMetadata } from "@/lib/providers/book-metadata";
import { searchOpenLibraryBooks } from "@/lib/providers/books";
import { searchGoogleBooks } from "@/lib/providers/google-books";
import { getTmdbTitle, searchTmdbTitles } from "@/lib/providers/tmdb";

type ImportOutcome = "created" | "promoted" | "unchanged";

function emptyResult(): ImportBatchResult {
  return { created: 0, promoted: 0, unchanged: 0, issues: [] };
}

function count(result: ImportBatchResult, outcome: ImportOutcome) {
  result[outcome] += 1;
}

function escapedBookQuery(value: string) {
  return value.replaceAll('"', "").trim();
}

async function openLibraryImportMetadata(item: GoodreadsImportItem, query: string, exactIdentity: boolean) {
  try {
    const candidates = await searchOpenLibraryBooks(query);
    const match = exactIdentity && candidates.length === 1
      ? candidates[0]
      : selectBookImportMatch(candidates, item.title, item.authors);
    if (!match) return null;
    return await getBookProviderMetadata({
      provider: "open_library",
      providerId: match.openLibraryWorkId,
      titleHint: item.title,
      authorHints: item.authors,
    });
  } catch {
    return null;
  }
}

async function googleBooksImportMetadata(item: GoodreadsImportItem, query: string, exactIdentity: boolean) {
  try {
    const candidates = await searchGoogleBooks(query);
    const match = exactIdentity && candidates.length === 1
      ? candidates[0]
      : selectBookImportMatch(candidates, item.title, item.authors);
    if (!match) return null;
    return await getBookProviderMetadata({
      provider: "google_books",
      providerId: match.googleBooksVolumeId,
      titleHint: item.title,
      authorHints: item.authors,
    });
  } catch {
    return null;
  }
}

async function resolveGoodreadsMetadata(item: GoodreadsImportItem) {
  const isbn = item.isbn13 ?? item.isbn;
  let metadata = isbn
    ? await openLibraryImportMetadata(item, `isbn:${isbn}`, true)
      ?? await googleBooksImportMetadata(item, `isbn:${isbn}`, true)
    : null;

  if (!metadata) {
    const title = escapedBookQuery(item.title);
    const author = escapedBookQuery(item.authors[0] ?? "");
    metadata = await openLibraryImportMetadata(item, `${title} ${author}`.trim(), false)
      ?? await googleBooksImportMetadata(item, `intitle:"${title}"${author ? ` inauthor:"${author}"` : ""}`, false);
  }

  return {
    provider: "goodreads" as const,
    providerId: item.goodreadsBookId,
    title: metadata?.title ?? item.title,
    authors: metadata?.authors.length ? metadata.authors : item.authors,
    contributors: metadata?.contributors ?? [],
    description: metadata?.description ?? null,
    coverUrl: metadata?.coverUrl ?? null,
    publishDate: metadata?.publishDate ?? (item.publishYear ? `${item.publishYear}-01-01` : null),
    pageCount: metadata?.pageCount ?? item.pageCount,
  };
}

async function inSmallGroups<T>(items: T[], task: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += 4) {
    await Promise.all(items.slice(index, index + 4).map(task));
  }
}

export async function importLetterboxdBatch(userId: string, items: LetterboxdImportItem[]) {
  const result = emptyResult();

  await inSmallGroups(items, async (item) => {
    try {
      const match = selectTmdbImportMatch(await searchTmdbTitles(item.title), item.title, item.year);
      if (!match) {
        result.issues.push({
          clientId: item.clientId,
          title: item.title,
          reason: item.year ? `No unambiguous TMDB match for ${item.year}.` : "No unambiguous TMDB match.",
        });
        return;
      }
      count(result, await importMovieForUser(userId, await getTmdbTitle(match.tmdbId, match.mediaType), item.status));
    } catch {
      result.issues.push({ clientId: item.clientId, title: item.title, reason: "Movie information could not be retrieved." });
    }
  });

  return result;
}

export async function importGoodreadsBatch(userId: string, items: GoodreadsImportItem[]) {
  const result = emptyResult();
  console.info("[imports:goodreads] Batch started.", { itemCount: items.length });

  await inSmallGroups(items, async (item) => {
    try {
      const metadata = await resolveGoodreadsMetadata(item);
      count(result, await importGoodreadsBookForUser(userId, item, metadata));
    } catch {
      result.issues.push({ clientId: item.clientId, title: item.title, reason: "The book could not be saved." });
    }
  });

  console.info("[imports:goodreads] Batch completed.", {
    created: result.created,
    issueCount: result.issues.length,
    promoted: result.promoted,
    unchanged: result.unchanged,
  });
  return result;
}
