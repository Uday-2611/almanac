import "server-only";

import type { BookProvider, BookProviderMetadata } from "@/lib/db/queries/books";
import {
  getOpenLibraryBook,
  OpenLibraryError,
  OpenLibraryNotFoundError,
} from "@/lib/providers/books";
import {
  getGoogleBooksVolume,
  GoogleBooksError,
  GoogleBooksNotFoundError,
  searchGoogleBooks,
  type GoogleBooksSearchBook,
} from "@/lib/providers/google-books";

const CACHE_TTL_MS = 10 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 100;

export type BookMetadataRequest = {
  provider: BookProvider;
  providerId: string;
  titleHint?: string;
  authorHints?: string[];
};

type CachedMetadata = { expiresAt: number; metadata: BookProviderMetadata };

const metadataCache = new Map<string, CachedMetadata>();
const pendingMetadata = new Map<string, Promise<BookProviderMetadata>>();

export class BookMetadataError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_id" | "not_found" | "timeout" | "unavailable",
  ) {
    super(message);
    this.name = "BookMetadataError";
  }
}

function identityKey(input: BookMetadataRequest) {
  return `${input.provider}:${input.providerId}`;
}

function pendingKey(input: BookMetadataRequest) {
  const title = input.titleHint?.trim().toLocaleLowerCase("en") ?? "";
  const authors = input.authorHints?.map((author) => author.trim().toLocaleLowerCase("en")).join("|") ?? "";
  return `${identityKey(input)}:${title}:${authors}`;
}

function remember(key: string, metadata: BookProviderMetadata) {
  metadataCache.delete(key);
  metadataCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, metadata });
  while (metadataCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = metadataCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    metadataCache.delete(oldestKey);
  }
}

function cachedMetadata(key: string) {
  const cached = metadataCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    metadataCache.delete(key);
    return null;
  }
  metadataCache.delete(key);
  metadataCache.set(key, cached);
  return cached.metadata;
}

function normalizeText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, " ").trim();
}

function candidateScore(candidate: GoogleBooksSearchBook, title: string, authors: string[]) {
  const expectedTitle = normalizeText(title);
  const candidateTitle = normalizeText(candidate.title);
  let score = candidateTitle === expectedTitle ? 100 : 0;
  if (!score && (candidateTitle.includes(expectedTitle) || expectedTitle.includes(candidateTitle))) score += 50;

  const expectedTokens = new Set(expectedTitle.split(" ").filter(Boolean));
  const candidateTokens = new Set(candidateTitle.split(" ").filter(Boolean));
  for (const token of expectedTokens) if (candidateTokens.has(token)) score += 4;

  const expectedAuthors = authors.map(normalizeText).filter(Boolean);
  for (const author of candidate.authorNames.map(normalizeText)) {
    if (expectedAuthors.some((expected) => expected === author || expected.includes(author) || author.includes(expected))) {
      score += 30;
    }
  }
  return score;
}

function bestGoogleCandidate(candidates: GoogleBooksSearchBook[], title: string, authors: string[]) {
  const best = candidates
    .map((candidate) => ({ candidate, score: candidateScore(candidate, title, authors) }))
    .sort((left, right) => right.score - left.score)[0];
  return best && best.score >= 12 ? best.candidate : null;
}

function mapOpenLibraryMetadata(
  input: BookMetadataRequest,
  source: Awaited<ReturnType<typeof getOpenLibraryBook>>,
): BookProviderMetadata {
  return {
    provider: input.provider,
    providerId: input.providerId,
    title: source.title,
    authors: source.authorNames,
    contributors: source.contributors,
    description: source.description,
    coverUrl: source.coverUrl,
    publishDate: source.publishDate,
    pageCount: source.pageCount,
  };
}

function mapGoogleMetadata(
  input: BookMetadataRequest,
  source: Awaited<ReturnType<typeof getGoogleBooksVolume>>,
): BookProviderMetadata {
  return {
    provider: input.provider,
    providerId: input.providerId,
    title: source.title,
    authors: source.authorNames,
    contributors: source.contributors,
    description: source.description,
    coverUrl: source.coverUrl,
    publishDate: source.publishDate,
    pageCount: source.pageCount,
  };
}

function providerError(error: unknown): BookMetadataError {
  if (error instanceof OpenLibraryNotFoundError || error instanceof GoogleBooksNotFoundError) {
    return new BookMetadataError("Book information was not found.", "not_found");
  }
  if ((error instanceof OpenLibraryError || error instanceof GoogleBooksError) && error.code === "invalid_id") {
    return new BookMetadataError("The provider ID is invalid.", "invalid_id");
  }
  if ((error instanceof OpenLibraryError || error instanceof GoogleBooksError) && error.code === "timeout") {
    return new BookMetadataError("The book database took too long to respond.", "timeout");
  }
  return new BookMetadataError("The book database is temporarily unavailable.", "unavailable");
}

async function loadMetadata(input: BookMetadataRequest): Promise<BookProviderMetadata> {
  if (input.provider === "google_books") {
    try {
      return mapGoogleMetadata(input, await getGoogleBooksVolume(input.providerId));
    } catch (error) {
      throw providerError(error);
    }
  }

  try {
    return mapOpenLibraryMetadata(input, await getOpenLibraryBook(input.providerId, {
      authorNames: input.authorHints,
    }));
  } catch (primaryError) {
    const title = input.titleHint?.trim();
    if (!title) throw providerError(primaryError);

    const primaryCode = primaryError instanceof OpenLibraryError ? primaryError.code : "request_failed";
    console.warn("[books:metadata] Open Library detail unavailable; trying Google Books.", {
      providerId: input.providerId,
      reason: primaryCode,
    });

    try {
      const primaryAuthor = input.authorHints?.find(Boolean);
      const query = `intitle:\"${title.replaceAll('"', "")}\"${primaryAuthor ? ` inauthor:\"${primaryAuthor.replaceAll('"', "")}\"` : ""}`;
      const candidate = bestGoogleCandidate(await searchGoogleBooks(query), title, input.authorHints ?? []);
      if (!candidate) throw primaryError;
      return mapGoogleMetadata(input, await getGoogleBooksVolume(candidate.googleBooksVolumeId));
    } catch (fallbackError) {
      if (fallbackError === primaryError) throw providerError(primaryError);
      const fallback = providerError(fallbackError);
      const primary = providerError(primaryError);
      if (primary.code === "not_found" && fallback.code === "not_found") throw primary;
      if (primary.code === "timeout" && fallback.code === "timeout") throw primary;
      throw fallback;
    }
  }
}

export function getBookProviderMetadata(input: BookMetadataRequest): Promise<BookProviderMetadata> {
  const key = identityKey(input);
  const cached = cachedMetadata(key);
  if (cached) return Promise.resolve(cached);

  const requestKey = pendingKey(input);
  const pending = pendingMetadata.get(requestKey);
  if (pending) return pending;

  const request = loadMetadata(input).then((metadata) => {
    remember(key, metadata);
    return metadata;
  });
  pendingMetadata.set(requestKey, request);
  void request.finally(() => pendingMetadata.delete(requestKey)).catch(() => undefined);
  return request;
}
