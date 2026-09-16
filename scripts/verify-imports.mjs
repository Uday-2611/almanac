import assert from "node:assert/strict";

import { parseGoodreadsCsvText, parseLetterboxdCsvFiles } from "../lib/imports/parse.ts";
import { selectBookImportMatch, selectTmdbImportMatch } from "../lib/imports/matching.ts";

const letterboxd = parseLetterboxdCsvFiles([
  {
    name: "export/watched.csv",
    text: "Date,Name,Year,Letterboxd URI\n2024-01-01,Arrival,2016,https://boxd.it/eoY\n",
  },
  {
    name: "export/watchlist.csv",
    text: "Date,Name,Year,Letterboxd URI\n2023-01-01,Arrival,2016,https://boxd.it/eoY\n2023-02-01,\"Paris, Texas\",1984,https://boxd.it/29qU\n",
  },
]);
assert.equal(letterboxd.items.length, 2, "Letterboxd identities should be de-duplicated");
assert.equal(letterboxd.counts.watched, 1, "Watched should take priority over watchlist");
assert.equal(letterboxd.counts.watchlist, 1);

const goodreads = parseGoodreadsCsvText([
  "Book Id,Title,Author,Additional Authors,ISBN,ISBN13,Number of Pages,Year Published,Bookshelves,Exclusive Shelf",
  "1,The Left Hand of Darkness,Ursula K. Le Guin,,=\"0441478123\",=\"9780441478125\",304,1969,to-read,to-read",
  "1,The Left Hand of Darkness,Ursula K. Le Guin,,=\"0441478123\",=\"9780441478125\",304,1969,,read",
  "2,Piranesi,Susanna Clarke,,,,245,2020,to-read,to-read",
  "3,Ignored Book,Someone,,,,200,2024,currently-reading,currently-reading",
].join("\n"));
assert.equal(goodreads.items.length, 2, "Only supported Goodreads shelves should be imported");
assert.equal(goodreads.counts.read, 1, "Read should take priority over Want to Read");
assert.equal(goodreads.counts.want_to_read, 1);
assert.equal(goodreads.ignoredCount, 1);
assert.equal(goodreads.items.find((item) => item.goodreadsBookId === "1")?.title, "The Left Hand of Darkness");
assert.equal(goodreads.items.find((item) => item.goodreadsBookId === "1")?.isbn13, "9780441478125");

const bookCandidates = [
  { title: "The Left Hand of Darkness", authorNames: ["Le Guin, Ursula K."] },
  { title: "The Left Hand of Darkness", authorNames: ["Another Author"] },
];
assert.equal(
  selectBookImportMatch(bookCandidates, "The Left Hand of Darkness", ["Ursula K. Le Guin"]),
  bookCandidates[0],
  "Book matching should tolerate Goodreads author-name ordering",
);
assert.equal(
  selectBookImportMatch(bookCandidates, "The Left Hand of Darkness", ["Unknown Author"]),
  null,
  "Book matching must not guess when the author does not match",
);

const candidates = [
  { tmdbId: 1, mediaType: "movie", title: "Arrival", year: "2016", overview: "", posterUrl: null },
  { tmdbId: 2, mediaType: "movie", title: "Arrival", year: "1996", overview: "", posterUrl: null },
];
assert.equal(selectTmdbImportMatch(candidates, "Arrival", "2016")?.tmdbId, 1);
assert.equal(selectTmdbImportMatch(candidates, "Arrival", null), null, "Undated title collisions must not be guessed");
assert.equal(selectTmdbImportMatch(candidates.slice(0, 1), "Arrival", null)?.tmdbId, 1);
assert.equal(selectTmdbImportMatch(candidates, "Arrival", "2001"), null, "Year mismatches must not be guessed");

console.log("Import parser and matching checks passed.");
