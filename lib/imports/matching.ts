import type { TmdbSearchTitle } from "@/lib/providers/tmdb-normalize";

function normalized(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, " ").trim();
}

export function selectTmdbImportMatch(candidates: TmdbSearchTitle[], title: string, year: string | null) {
  const titleMatches = candidates.filter((candidate) => normalized(candidate.title) === normalized(title));
  if (year) {
    const yearMatches = titleMatches.filter((candidate) => candidate.year === year);
    if (yearMatches.length === 1) return yearMatches[0];
    if (yearMatches.length > 1) {
      const movieMatches = yearMatches.filter((candidate) => candidate.mediaType === "movie");
      return movieMatches.length === 1 ? movieMatches[0] : null;
    }
    return null;
  }
  if (titleMatches.length === 1) return titleMatches[0];
  const movieMatches = titleMatches.filter((candidate) => candidate.mediaType === "movie");
  return movieMatches.length === 1 ? movieMatches[0] : null;
}

type BookImportCandidate = {
  authorNames: string[];
  title: string;
};

function normalizedAuthor(value: string) {
  return normalized(value).split(" ").filter(Boolean).sort().join(" ");
}

export function selectBookImportMatch<T extends BookImportCandidate>(
  candidates: T[],
  title: string,
  authors: string[],
) {
  const expectedAuthors = new Set(authors.map(normalizedAuthor).filter(Boolean));
  const matches = candidates.filter((candidate) => (
    normalized(candidate.title) === normalized(title)
    && candidate.authorNames.some((author) => expectedAuthors.has(normalizedAuthor(author)))
  ));
  return matches.length === 1 ? matches[0] : null;
}
