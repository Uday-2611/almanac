"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  GOODREADS_IMPORT_BATCH_SIZE,
  LETTERBOXD_IMPORT_BATCH_SIZE,
  type ImportBatchResult,
  type MediaImportItem,
  type ParsedMediaImport,
} from "@/lib/imports/types";

type ImportSource = "letterboxd" | "goodreads";

const sourceDetails = {
  letterboxd: {
    accept: ".zip,.csv,application/zip,text/csv",
    description: "Imports watched.csv and watchlist.csv from your Letterboxd data export.",
    exportLabel: "Open Letterboxd export",
    exportUrl: "https://letterboxd.com/user/exportdata/",
    fileLabel: "Letterboxd ZIP or CSV",
    name: "Letterboxd",
  },
  goodreads: {
    accept: ".csv,text/csv",
    description: "Imports the Read and Want to Read shelves from your Goodreads library CSV.",
    exportLabel: "Open Goodreads export",
    exportUrl: "https://www.goodreads.com/review/import",
    fileLabel: "Goodreads CSV",
    name: "Goodreads",
  },
} as const;

const emptyResult: ImportBatchResult = { created: 0, promoted: 0, unchanged: 0, issues: [] };
const transientStatuses = new Set([502, 503, 504]);

class ImportRequestError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "ImportRequestError";
  }
}

function retryDelay(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

async function sendImportBatch(source: ImportSource, items: MediaImportItem[]) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("/api/imports/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, items }),
        signal: AbortSignal.timeout(45_000),
      });
      const body = await response.json().catch(() => null) as (ImportBatchResult & {
        error?: string;
        retryable?: boolean;
      }) | null;

      if (!response.ok) {
        throw new ImportRequestError(
          body?.error || `The import service returned an error (${response.status}).`,
          body?.retryable ?? transientStatuses.has(response.status),
        );
      }
      if (!body) throw new ImportRequestError("The import service returned an incomplete response.", true);
      return body;
    } catch (caught) {
      const error = caught instanceof Error ? caught : new Error("The import request failed.");
      const retryable = error instanceof ImportRequestError ? error.retryable : true;
      lastError = error;
      if (!retryable || attempt === 2) throw error;
      await retryDelay(attempt === 0 ? 350 : 900);
    }
  }

  throw lastError ?? new Error("The import request failed.");
}

function addResults(left: ImportBatchResult, right: ImportBatchResult): ImportBatchResult {
  return {
    created: left.created + right.created,
    promoted: left.promoted + right.promoted,
    unchanged: left.unchanged + right.unchanged,
    issues: [...left.issues, ...right.issues],
  };
}

function PreviewCounts({ parsed }: { parsed: ParsedMediaImport }) {
  const labels = parsed.source === "letterboxd"
    ? [["watched", "Watched"], ["watchlist", "Watchlist"]]
    : [["read", "Read"], ["want_to_read", "Want to Read"]];

  return (
    <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 sm:max-w-md">
      {labels.map(([key, label]) => (
        <div key={key}>
          <dt className="text-xs text-[#686868]">{label}</dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums">{parsed.counts[key] ?? 0}</dd>
        </div>
      ))}
      {parsed.ignoredCount > 0 ? (
        <div className="col-span-2 text-xs text-[#686868]">
          {parsed.ignoredCount.toLocaleString("en-US")} unsupported or incomplete {parsed.ignoredCount === 1 ? "row was" : "rows were"} left out.
        </div>
      ) : null}
    </dl>
  );
}

function ImportPanel({ source }: { source: ImportSource }) {
  const details = sourceDetails[source];
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedMediaImport | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [resumeIndex, setResumeIndex] = useState(0);
  const [partialResult, setPartialResult] = useState<ImportBatchResult>(emptyResult);
  const [result, setResult] = useState<ImportBatchResult | null>(null);

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    setParsed(null);
    setFileName(file.name);
    setProcessed(0);
    setResumeIndex(0);
    setPartialResult(emptyResult);
    setIsParsing(true);
    try {
      const { parseGoodreadsExport, parseLetterboxdExport } = await import("@/lib/imports/parse");
      const next = source === "letterboxd" ? await parseLetterboxdExport(file) : await parseGoodreadsExport(file);
      if (!next.items.length) throw new Error(`No supported ${source === "letterboxd" ? "films" : "books"} were found.`);
      setParsed(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The export could not be read.");
    } finally {
      setIsParsing(false);
    }
  }

  async function importLibrary() {
    if (!parsed || isImporting) return;
    setError(null);
    setResult(null);
    setProcessed(resumeIndex);
    setIsImporting(true);
    let nextResult = resumeIndex > 0 ? partialResult : emptyResult;
    const batchSize = parsed.source === "letterboxd"
      ? LETTERBOXD_IMPORT_BATCH_SIZE
      : GOODREADS_IMPORT_BATCH_SIZE;

    try {
      for (let index = resumeIndex; index < parsed.items.length; index += batchSize) {
        const items = parsed.items.slice(index, index + batchSize);
        const body = await sendImportBatch(parsed.source, items);
        nextResult = addResults(nextResult, body);
        const nextIndex = Math.min(index + items.length, parsed.items.length);
        setProcessed(nextIndex);
        setResumeIndex(nextIndex);
        setPartialResult(nextResult);
      }
      setResult(nextResult);
      setResumeIndex(0);
      setPartialResult(emptyResult);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The import could not continue. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }

  const completeCount = result ? result.created + result.promoted + result.unchanged : 0;

  return (
    <section className="border-t border-[#e8e8e8] py-8" aria-labelledby={`${source}-import-heading`}>
      <div className="max-w-2xl">
        <h2 id={`${source}-import-heading`} className="text-base font-semibold">{details.name}</h2>
        <p className="mt-2 text-sm leading-6 text-[#686868]">{details.description}</p>
        <a
          href={details.exportUrl}
          target="_blank"
          rel="noreferrer"
          className="ledger-focus mt-2 inline-block px-1 py-0.5 text-sm underline decoration-black/25 underline-offset-4 hover:decoration-black"
        >
          {details.exportLabel}
        </a>

        <div className="mt-5">
          <label htmlFor={`${source}-export`} className="block text-xs font-medium text-[#686868]">{details.fileLabel}</label>
          <input
            id={`${source}-export`}
            type="file"
            accept={details.accept}
            disabled={isParsing || isImporting}
            onChange={(event) => void chooseFile(event.currentTarget.files?.[0])}
            className="mt-2 block w-full max-w-xl cursor-pointer rounded-[4px] border border-[#dedede] bg-white text-xs text-[#686868] file:mr-2 file:border-0 file:border-r file:border-[#dedede] file:bg-[#f7f7f7] file:px-2 file:py-3 file:text-xs file:font-medium file:text-[#111111] hover:file:bg-[#f1f1f1] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm sm:file:mr-4 sm:file:px-3 sm:file:py-2 sm:file:text-sm"
          />
        </div>

        <div className="mt-3 min-h-5 text-sm text-[#686868]" aria-live="polite">
          {isParsing ? `Reading ${fileName}…` : null}
          {error ? <p className="text-[#8a2d2d]">{error}</p> : null}
        </div>

        {parsed && !result ? (
          <div>
            <p className="text-sm"><span className="font-medium">{fileName}</span> is ready to import.</p>
            <PreviewCounts parsed={parsed} />
            <p className="mt-5 max-w-xl text-xs leading-5 text-[#686868]">
              Existing titles will not be duplicated. Watched and Read take priority, and Almanac will preserve existing ratings, reviews, dates, Archive Notes, tags, and custom lists.
            </p>
            <button
              type="button"
              disabled={isImporting}
              onClick={() => void importLibrary()}
              className="ledger-focus mt-4 px-1 py-1 text-sm font-medium underline decoration-black/25 underline-offset-4 hover:decoration-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting
                ? `Importing ${processed.toLocaleString("en-US")} of ${parsed.items.length.toLocaleString("en-US")}…`
                : resumeIndex > 0
                  ? `Continue import — ${resumeIndex.toLocaleString("en-US")} of ${parsed.items.length.toLocaleString("en-US")} complete`
                  : `Import ${parsed.items.length.toLocaleString("en-US")} titles`}
            </button>
          </div>
        ) : null}

        {result ? (
          <div className="mt-2" aria-live="polite">
            <p className="text-sm font-medium">Import complete</p>
            <p className="mt-1 text-sm leading-6 text-[#686868]">
              {result.created.toLocaleString("en-US")} added, {result.promoted.toLocaleString("en-US")} moved to a completed collection, and {result.unchanged.toLocaleString("en-US")} already present.
            </p>
            {result.issues.length ? (
              <div className="mt-5">
                <p className="text-sm">{result.issues.length.toLocaleString("en-US")} of {completeCount + result.issues.length} could not be matched.</p>
                <ul className="mt-2 divide-y divide-[#eeeeee] text-sm text-[#686868]">
                  {result.issues.slice(0, 20).map((issue) => (
                    <li key={issue.clientId} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <span className="truncate text-[#111111]">{issue.title}</span>
                      <span>{issue.reason}</span>
                    </li>
                  ))}
                </ul>
                {result.issues.length > 20 ? <p className="mt-2 text-xs">Only the first 20 unmatched titles are shown.</p> : null}
                <p className="mt-3 text-xs leading-5">You can add unmatched titles through Almanac search after reviewing the correct edition or release.</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function LibraryImport() {
  return (
    <div>
      <ImportPanel source="letterboxd" />
      <ImportPanel source="goodreads" />
    </div>
  );
}
