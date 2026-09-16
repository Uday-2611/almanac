import { strFromU8, unzipSync } from "fflate";
import Papa from "papaparse";

import type {
  GoodreadsImportItem,
  GoodreadsImportStatus,
  LetterboxdImportItem,
  ParsedMediaImport,
} from "@/lib/imports/types";

const MAX_IMPORT_ITEMS = 10_000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_EXPANDED_CSV_BYTES = 40 * 1024 * 1024;

type CsvRow = Record<string, string | undefined>;

function parseCsv(text: string) {
  const result = Papa.parse<CsvRow>(text.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  if (result.errors.some((error) => error.type === "Quotes")) {
    throw new Error("The export contains malformed quoted text.");
  }
  return result.data;
}

function field(row: CsvRow, ...names: string[]) {
  for (const name of names) {
    const wanted = name.toLocaleLowerCase("en");
    const entry = Object.entries(row).find(([key]) => key.trim().toLocaleLowerCase("en") === wanted);
    const value = entry?.[1]?.trim();
    if (value) return value;
  }
  return "";
}

function normalizedIdentity(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, " ").trim();
}

function safeYear(value: string) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1800 && year <= new Date().getFullYear() + 10
    ? String(year)
    : null;
}

function safePositiveInteger(value: string) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function cleanIsbn(value: string) {
  const cleaned = value.replace(/^="?/, "").replace(/"$/, "").replace(/[^0-9Xx]/g, "").toUpperCase();
  return /^\d{9}[\dX]$/.test(cleaned) || /^\d{13}$/.test(cleaned) ? cleaned : null;
}

function putLetterboxdItem(target: Map<string, LetterboxdImportItem>, key: string, item: LetterboxdImportItem) {
  const existing = target.get(key);
  if (!existing || item.status === "watched") target.set(key, item);
}

export function parseLetterboxdCsvFiles(
  files: { name: string; text: string }[],
): ParsedMediaImport {
  const items = new Map<string, LetterboxdImportItem>();
  let ignoredCount = 0;
  let supportedFileCount = 0;

  for (const file of files) {
    const basename = file.name.replaceAll("\\", "/").split("/").at(-1)?.toLocaleLowerCase("en");
    const status = basename === "watched.csv" ? "watched" : basename === "watchlist.csv" ? "watchlist" : null;
    if (!status) continue;
    supportedFileCount += 1;

    for (const [index, row] of parseCsv(file.text).entries()) {
      const title = field(row, "Name", "Title");
      if (!title || title.length > 300) {
        ignoredCount += 1;
        continue;
      }
      const sourceUri = field(row, "Letterboxd URI", "LetterboxdURI", "URL") || null;
      const year = safeYear(field(row, "Year"));
      putLetterboxdItem(items, sourceUri || `${normalizedIdentity(title)}:${year ?? ""}`, {
        clientId: `letterboxd:${normalizedIdentity(title)}:${year ?? ""}:${index}`,
        source: "letterboxd",
        status,
        title,
        year,
      });
    }
  }

  if (!supportedFileCount) throw new Error("This archive does not contain watched.csv or watchlist.csv.");
  if (items.size > MAX_IMPORT_ITEMS) throw new Error(`An import can contain at most ${MAX_IMPORT_ITEMS.toLocaleString("en-US")} titles.`);

  const result = [...items.values()];
  return {
    source: "letterboxd",
    items: result,
    ignoredCount,
    counts: {
      watched: result.filter((item) => item.status === "watched").length,
      watchlist: result.filter((item) => item.status === "watchlist").length,
    },
  };
}

export async function parseLetterboxdExport(file: File): Promise<ParsedMediaImport> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Choose a Letterboxd export smaller than 25 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (file.name.toLocaleLowerCase("en").endsWith(".csv")) {
    return parseLetterboxdCsvFiles([{ name: file.name, text: strFromU8(bytes) }]);
  }

  let archive: ReturnType<typeof unzipSync>;
  try {
    archive = unzipSync(bytes);
  } catch {
    throw new Error("Choose the ZIP downloaded from Letterboxd settings.");
  }

  const csvFiles = Object.entries(archive).filter(([name]) => name.toLocaleLowerCase("en").endsWith(".csv"));
  const expandedBytes = csvFiles.reduce((total, [, contents]) => total + contents.byteLength, 0);
  if (expandedBytes > MAX_EXPANDED_CSV_BYTES) throw new Error("The expanded Letterboxd export is too large to import safely.");
  return parseLetterboxdCsvFiles(csvFiles.map(([name, contents]) => ({ name, text: strFromU8(contents) })));
}

function goodreadsStatus(value: string): GoodreadsImportStatus | null {
  const normalized = value.trim().toLocaleLowerCase("en").replaceAll("_", "-");
  if (normalized === "read") return "read";
  if (normalized === "to-read" || normalized === "want-to-read") return "want_to_read";
  return null;
}

function splitAuthors(primary: string, additional: string) {
  return [primary, ...additional.split(",")].map((author) => author.trim()).filter(Boolean).slice(0, 12);
}

export function parseGoodreadsCsvText(text: string): ParsedMediaImport {
  const items = new Map<string, GoodreadsImportItem>();
  let ignoredCount = 0;

  for (const [index, row] of parseCsv(text).entries()) {
    const status = goodreadsStatus(field(row, "Exclusive Shelf", "Bookshelves"));
    const title = field(row, "Title");
    const authors = splitAuthors(field(row, "Author"), field(row, "Additional Authors"));
    const goodreadsBookId = field(row, "Book Id", "Book ID");
    if (!status || !title || title.length > 300 || !authors.length) {
      ignoredCount += 1;
      continue;
    }

    const isbn = cleanIsbn(field(row, "ISBN"));
    const isbn13 = cleanIsbn(field(row, "ISBN13"));
    const identity = goodreadsBookId || isbn13 || isbn || `${normalizedIdentity(title)}:${normalizedIdentity(authors[0])}`;
    const item: GoodreadsImportItem = {
      authors,
      clientId: `goodreads:${identity}:${index}`,
      goodreadsBookId: goodreadsBookId || identity,
      isbn,
      isbn13,
      pageCount: safePositiveInteger(field(row, "Number of Pages")),
      publishYear: safePositiveInteger(field(row, "Year Published", "Original Publication Year")),
      source: "goodreads",
      status,
      title,
    };
    const existing = items.get(identity);
    if (!existing || item.status === "read") items.set(identity, item);
  }

  if (items.size > MAX_IMPORT_ITEMS) throw new Error(`An import can contain at most ${MAX_IMPORT_ITEMS.toLocaleString("en-US")} books.`);
  if (!items.size && ignoredCount === 0) throw new Error("This does not look like a Goodreads library export.");

  const result = [...items.values()];
  return {
    source: "goodreads",
    items: result,
    ignoredCount,
    counts: {
      read: result.filter((item) => item.status === "read").length,
      want_to_read: result.filter((item) => item.status === "want_to_read").length,
    },
  };
}

export async function parseGoodreadsExport(file: File): Promise<ParsedMediaImport> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Choose a Goodreads export smaller than 25 MB.");
  if (!file.name.toLocaleLowerCase("en").endsWith(".csv")) throw new Error("Choose the CSV downloaded from Goodreads.");
  return parseGoodreadsCsvText(await file.text());
}
