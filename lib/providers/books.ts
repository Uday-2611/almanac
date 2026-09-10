import "server-only";

const OPEN_LIBRARY_URL = "https://openlibrary.org";
const OPEN_LIBRARY_COVERS_URL = "https://covers.openlibrary.org";
const DETAIL_TIMEOUT_MS = 3_500;
const SEARCH_TIMEOUT_MS = 2_500;
const SEARCH_LIMIT = 8;
const MAX_AUTHORS = 12;
const FALLBACK_CONTACT_EMAIL = "contact@almanac.invalid";

type OpenLibrarySearchDocument = {
  key?: string;
  title?: string;
  author_key?: string[];
  author_name?: string[];
  contributor?: string[];
  cover_i?: number;
  first_publish_year?: number;
  publish_year?: number[];
  number_of_pages_median?: number;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDocument[];
};

type OpenLibraryWorkResponse = {
  key?: string;
  title?: string;
  description?: string | { value?: string };
  covers?: number[];
  first_publish_date?: string;
  authors?: Array<{ author?: { key?: string } }>;
};

type OpenLibraryAuthorResponse = {
  name?: string;
};

export type OpenLibraryAuthor = {
  openLibraryAuthorId: string | null;
  name: string;
};

export type OpenLibrarySearchBook = {
  openLibraryWorkId: string;
  title: string;
  authors: OpenLibraryAuthor[];
  authorNames: string[];
  coverUrl: string | null;
  publishYear: number | null;
  pageCount: number | null;
};

export type OpenLibraryBook = OpenLibrarySearchBook & {
  contributors: string[];
  description: string | null;
  publishDate: string | null;
  openLibraryUrl: string;
};

export class OpenLibraryError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly code: "invalid_id" | "not_found" | "request_failed" | "timeout" = "request_failed",
  ) {
    super(message);
    this.name = "OpenLibraryError";
  }
}

export class OpenLibraryNotFoundError extends OpenLibraryError {
  constructor(workId: string) {
    super(`Open Library work ${workId} was not found.`, 404, "not_found");
    this.name = "OpenLibraryNotFoundError";
  }
}

export const bookProvidersConfigured = true;

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
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

export function normalizeOpenLibraryWorkId(value: string): string {
  const candidate = value.trim().split("/").filter(Boolean).at(-1)?.toUpperCase() ?? "";

  if (!/^OL\d+W$/.test(candidate)) {
    throw new OpenLibraryError("A valid Open Library work ID is required.", null, "invalid_id");
  }

  return candidate;
}

export function openLibraryCoverUrl(coverId: number | null, size: "M" | "L" = "L"): string | null {
  if (!positiveInteger(coverId)) return null;
  return `${OPEN_LIBRARY_COVERS_URL}/b/id/${coverId}-${size}.jpg?default=false`;
}

function authorId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim().split("/").filter(Boolean).at(-1)?.toUpperCase() ?? "";
  return /^OL\d+A$/.test(candidate) ? candidate : null;
}

function normalizeAuthors(document: OpenLibrarySearchDocument): OpenLibraryAuthor[] {
  const names = uniqueText(document.author_name, MAX_AUTHORS);
  const keys = Array.isArray(document.author_key) ? document.author_key : [];

  return names.map((name, index) => ({
    openLibraryAuthorId: authorId(keys[index]),
    name,
  }));
}

function descriptionValue(description: OpenLibraryWorkResponse["description"]): string | null {
  if (typeof description === "string") return cleanText(description);
  return cleanText(description?.value);
}

function publishYear(document: OpenLibrarySearchDocument): number | null {
  const firstYear = positiveInteger(document.first_publish_year);
  if (firstYear) return firstYear;

  if (!Array.isArray(document.publish_year)) return null;
  const years = document.publish_year.map(positiveInteger).filter((year): year is number => year !== null);
  return years.length ? Math.min(...years) : null;
}

function isoPublishDate(value: string | null, year: number | null): string | null {
  if (value) {
    const exactDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (exactDate) return exactDate[0];

    const yearMonth = value.match(/^(\d{4})-(\d{2})$/);
    if (yearMonth) return `${yearMonth[1]}-${yearMonth[2]}-01`;

    const yearOnly = value.match(/^(\d{4})$/);
    if (yearOnly) return `${yearOnly[1]}-01-01`;

    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) return new Date(timestamp).toISOString().slice(0, 10);
  }

  return year ? `${year.toString().padStart(4, "0")}-01-01` : null;
}

function contactEmail(): string {
  const configured = process.env.OPEN_LIBRARY_CONTACT_EMAIL?.trim();
  if (!configured || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured) || configured.length > 254) {
    return FALLBACK_CONTACT_EMAIL;
  }
  return configured;
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;

  const cause = "cause" in error ? error.cause : null;
  return typeof cause === "object" && cause !== null && "code" in cause
    && (cause.code === "UND_ERR_CONNECT_TIMEOUT" || cause.code === "ETIMEDOUT");
}

async function openLibraryFetch<T>(path: string, params: Record<string, string> = {}, revalidate = 3_600, timeoutMs = DETAIL_TIMEOUT_MS): Promise<T> {
  const url = new URL(path, OPEN_LIBRARY_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `Almanac/1.0 (contact: ${contactEmail()})`,
      },
      next: { revalidate },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new OpenLibraryError("Open Library took too long to respond.", null, "timeout");
    }
    throw new OpenLibraryError("Open Library could not be reached.");
  }

  if (response.status === 404) throw new OpenLibraryNotFoundError(path);
  if (!response.ok) {
    throw new OpenLibraryError(`Open Library request failed with status ${response.status}.`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new OpenLibraryError("Open Library returned an invalid response.", response.status);
  }
}

function normalizeSearchBook(document: OpenLibrarySearchDocument): OpenLibrarySearchBook | null {
  if (!document.key || !document.title) return null;

  let openLibraryWorkId: string;
  try {
    openLibraryWorkId = normalizeOpenLibraryWorkId(document.key);
  } catch {
    return null;
  }

  const authors = normalizeAuthors(document);

  return {
    openLibraryWorkId,
    title: cleanText(document.title) ?? "Untitled",
    authors,
    authorNames: authors.map((author) => author.name),
    coverUrl: openLibraryCoverUrl(positiveInteger(document.cover_i), "M"),
    publishYear: publishYear(document),
    pageCount: positiveInteger(document.number_of_pages_median),
  };
}

async function fetchAuthorNames(authorIds: string[]): Promise<OpenLibraryAuthor[]> {
  const results = await Promise.allSettled(
    authorIds.slice(0, MAX_AUTHORS).map(async (id) => {
      const author = await openLibraryFetch<OpenLibraryAuthorResponse>(`/authors/${id}.json`, {}, 86_400);
      const name = cleanText(author.name);
      return name ? { openLibraryAuthorId: id, name } : null;
    }),
  );

  return results.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
}

export async function searchOpenLibraryBooks(query: string): Promise<OpenLibrarySearchBook[]> {
  const normalizedQuery = query.replace(/\s+/g, " ").trim();
  if (!normalizedQuery) return [];

  const data = await openLibraryFetch<OpenLibrarySearchResponse>("/search.json", {
    q: normalizedQuery,
    fields: [
      "key",
      "title",
      "author_key",
      "author_name",
      "cover_i",
      "first_publish_year",
      "number_of_pages_median",
    ].join(","),
    limit: SEARCH_LIMIT.toString(),
  }, 3_600, SEARCH_TIMEOUT_MS);

  return (Array.isArray(data.docs) ? data.docs : [])
    .map(normalizeSearchBook)
    .filter((book): book is OpenLibrarySearchBook => book !== null)
    .slice(0, SEARCH_LIMIT);
}

export async function getOpenLibraryBook(workId: string): Promise<OpenLibraryBook> {
  const openLibraryWorkId = normalizeOpenLibraryWorkId(workId);
  const [workResult, searchResult] = await Promise.allSettled([
    openLibraryFetch<OpenLibraryWorkResponse>(`/works/${openLibraryWorkId}.json`, {}, 86_400),
    openLibraryFetch<OpenLibrarySearchResponse>("/search.json", {
      q: `key:"/works/${openLibraryWorkId}"`,
      mode: "everything",
      fields: [
        "key",
        "title",
        "author_key",
        "author_name",
        "contributor",
        "cover_i",
        "first_publish_year",
        "publish_year",
        "number_of_pages_median",
      ].join(","),
      limit: "1",
    }, 86_400),
  ]);

  if (workResult.status === "rejected") throw workResult.reason;

  const work = workResult.value;
  const document = searchResult.status === "fulfilled" && Array.isArray(searchResult.value.docs)
    ? searchResult.value.docs[0] ?? {}
    : {};
  const workAuthorIds = (Array.isArray(work.authors) ? work.authors : [])
    .map((entry) => authorId(entry.author?.key))
    .filter((id): id is string => id !== null);
  let authors = normalizeAuthors(document);

  if (!authors.length && workAuthorIds.length) authors = await fetchAuthorNames(workAuthorIds);

  const firstPublishYear = work.first_publish_date?.match(/\d{4}/)?.[0];
  const year = publishYear(document) ?? positiveInteger(firstPublishYear ? Number(firstPublishYear) : null);
  const coverId = (Array.isArray(work.covers) ? work.covers : [])
    .map(positiveInteger)
    .find((id): id is number => id !== null) ?? positiveInteger(document.cover_i);

  return {
    openLibraryWorkId,
    title: cleanText(work.title) ?? cleanText(document.title) ?? "Untitled",
    authors,
    authorNames: authors.map((author) => author.name),
    contributors: uniqueText(document.contributor),
    description: descriptionValue(work.description),
    coverUrl: openLibraryCoverUrl(coverId, "L"),
    publishDate: isoPublishDate(cleanText(work.first_publish_date), year),
    publishYear: year,
    pageCount: positiveInteger(document.number_of_pages_median),
    openLibraryUrl: `${OPEN_LIBRARY_URL}/works/${openLibraryWorkId}`,
  };
}
