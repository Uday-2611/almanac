export type SearchScope = "all" | "movie" | "book"

export type MediaSearchResult = {
  id: string
  kind: Exclude<SearchScope, "all">
  title: string
  credit: string
  year: string
  artwork: string | null
}

export const searchCatalog: MediaSearchResult[] = [
  { id: "dune-part-two", kind: "movie", title: "Dune: Part Two", credit: "Denis Villeneuve", year: "2024", artwork: "https://image.tmdb.org/t/p/w185/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
  { id: "nightcrawler", kind: "movie", title: "Nightcrawler", credit: "Dan Gilroy", year: "2014", artwork: "https://image.tmdb.org/t/p/w185/j9HrX8f7GbZQm1BrBiR40uFQZSb.jpg" },
  { id: "in-the-mood-for-love", kind: "movie", title: "In the Mood for Love", credit: "Wong Kar-wai", year: "2000", artwork: "https://image.tmdb.org/t/p/w185/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg" },
  { id: "aftersun", kind: "movie", title: "Aftersun", credit: "Charlotte Wells", year: "2022", artwork: "https://image.tmdb.org/t/p/w185/jeXmhP2zbUkREMRqFOYIwQOk49T.jpg" },
  { id: "the-left-hand-of-darkness", kind: "book", title: "The Left Hand of Darkness", credit: "Ursula K. Le Guin", year: "1969", artwork: "https://covers.openlibrary.org/b/isbn/9780441478125-M.jpg" },
  { id: "stoner", kind: "book", title: "Stoner", credit: "John Williams", year: "1965", artwork: "https://covers.openlibrary.org/b/isbn/9781590171998-M.jpg" },
  { id: "beloved", kind: "book", title: "Beloved", credit: "Toni Morrison", year: "1987", artwork: "https://covers.openlibrary.org/b/isbn/9781400033416-M.jpg" },
  { id: "the-summer-book", kind: "book", title: "The Summer Book", credit: "Tove Jansson", year: "1972", artwork: "https://covers.openlibrary.org/b/isbn/9781590172681-M.jpg" },
]
