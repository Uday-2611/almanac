import "server-only";

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/";
const REQUEST_TIMEOUT_MS = 8_000;
const SEARCH_LIMIT = 8;

type GoogleVolumeInfo = {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  imageLinks?: Partial<Record<"smallThumbnail" | "thumbnail" | "small" | "medium" | "large" | "extraLarge", string>>;
};

type GoogleVolume = {
  id?: string;
  volumeInfo?: GoogleVolumeInfo;
};

type GoogleVolumesResponse = {
  items?: GoogleVolume[];
};

export type GoogleBooksSearchBook = {
  googleBooksVolumeId: string;
  title: string;
  authorNames: string[];
  coverUrl: string | null;
  publishYear: number | null;
};

export type GoogleBooksBook = GoogleBooksSearchBook & {
  contributors: string[];
  description: string | null;
  publishDate: string | null;
  pageCount: number | null;
};

export class GoogleBooksError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly code: "invalid_id" | "not_found" | "request_failed" | "timeout" = "request_failed",
  ) {
    super(message);
    this.name = "GoogleBooksError";
  }
}

export class GoogleBooksNotFoundError extends GoogleBooksError {
  constructor(volumeId: string) {
    super(`Google Books volume ${volumeId} was not found.`, 404, "not_found");
    this.name = "GoogleBooksNotFoundError";
  }
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function uniqueText(values: unknown, limit = 20): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = cleanText(value);
    if (!text) continue;
    const key = text.toLocaleLowerCase("en");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }

  return result;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function normalizePublishedDate(value: unknown): string | null {
  const date = cleanText(value);
  if (!date) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`;
  if (/^\d{4}$/.test(date)) return `${date}-01-01`;
  return null;
}

function normalizeCoverUrl(imageLinks: GoogleVolumeInfo["imageLinks"]): string | null {
  if (!imageLinks) return null;
  const url = imageLinks.extraLarge ?? imageLinks.large ?? imageLinks.medium
    ?? imageLinks.small ?? imageLinks.thumbnail ?? imageLinks.smallThumbnail;
  return cleanText(url)?.replace(/^http:\/\//i, "https://") ?? null;
}

function normalizeVolumeId(value: string): string {
  const id = value.trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new GoogleBooksError("A valid Google Books volume ID is required.", null, "invalid_id");
  }
  return id;
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  const cause = "cause" in error ? error.cause : null;
  return typeof cause === "object" && cause !== null && "code" in cause
    && (cause.code === "UND_ERR_CONNECT_TIMEOUT" || cause.code === "ETIMEDOUT");
}

async function googleBooksFetch<T>(path: string, params: Record<string, string> = {}, revalidate = 3_600): Promise<T> {
  const url = new URL(path, GOOGLE_BOOKS_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (apiKey) url.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (isTimeoutError(error)) throw new GoogleBooksError("Google Books took too long to respond.", null, "timeout");
    throw new GoogleBooksError("Google Books could not be reached.");
  }

  if (response.status === 404) throw new GoogleBooksNotFoundError(path);
  if (!response.ok) throw new GoogleBooksError(`Google Books request failed with status ${response.status}.`, response.status);

  try {
    return await response.json() as T;
  } catch {
    throw new GoogleBooksError("Google Books returned an invalid response.", response.status);
  }
}

function normalizeSearchVolume(volume: GoogleVolume): GoogleBooksSearchBook | null {
  if (!volume.id || !volume.volumeInfo?.title) return null;

  let googleBooksVolumeId: string;
  try {
    googleBooksVolumeId = normalizeVolumeId(volume.id);
  } catch {
    return null;
  }

  const publishedDate = normalizePublishedDate(volume.volumeInfo.publishedDate);
  return {
    googleBooksVolumeId,
    title: cleanText(volume.volumeInfo.title) ?? "Untitled",
    authorNames: uniqueText(volume.volumeInfo.authors),
    coverUrl: normalizeCoverUrl(volume.volumeInfo.imageLinks),
    publishYear: publishedDate ? Number(publishedDate.slice(0, 4)) : null,
  };
}

export async function searchGoogleBooks(query: string): Promise<GoogleBooksSearchBook[]> {
  const normalizedQuery = query.replace(/\s+/g, " ").trim();
  if (!normalizedQuery) return [];

  const data = await googleBooksFetch<GoogleVolumesResponse>("volumes", {
    q: normalizedQuery,
    maxResults: String(SEARCH_LIMIT),
    orderBy: "relevance",
    printType: "books",
    projection: "lite",
  });

  return (Array.isArray(data.items) ? data.items : [])
    .map(normalizeSearchVolume)
    .filter((book): book is GoogleBooksSearchBook => book !== null)
    .slice(0, SEARCH_LIMIT);
}

export async function getGoogleBooksVolume(volumeId: string): Promise<GoogleBooksBook> {
  const googleBooksVolumeId = normalizeVolumeId(volumeId);
  const volume = await googleBooksFetch<GoogleVolume>(`volumes/${encodeURIComponent(googleBooksVolumeId)}`, {
    projection: "full",
  }, 86_400);
  const normalized = normalizeSearchVolume(volume);
  if (!normalized) throw new GoogleBooksNotFoundError(googleBooksVolumeId);
  const info = volume.volumeInfo ?? {};

  return {
    ...normalized,
    contributors: cleanText(info.publisher) ? [`Published by ${cleanText(info.publisher)}`] : [],
    description: cleanText(info.description),
    publishDate: normalizePublishedDate(info.publishedDate),
    pageCount: positiveInteger(info.pageCount),
  };
}
