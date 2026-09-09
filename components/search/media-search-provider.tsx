"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useDeferredValue, useEffect, useRef, useState, useTransition, type ReactNode } from "react"
import { X } from "lucide-react"

import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogViewport,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MovieAddConfirmation } from "@/components/movies/movie-add-confirmation"
import { SearchResultSkeleton } from "@/components/states/interaction-skeleton"
import type { SearchScope } from "@/lib/search/catalog"

type SearchContextValue = { openSearch: (scope?: SearchScope) => void }
type MovieStatus = "watchlist" | "watched"
type BookStatus = "want_to_read" | "read"
type MediaKind = "movie" | "book"
type SearchResult = {
  id: string
  kind: MediaKind
  title: string
  credit: string
  year: string
  artwork: string | null
  provider?: string
}
type PendingAdd =
  | { kind: "movie"; status: MovieStatus; id: string }
  | { kind: "book"; status: BookStatus; id: string }
type AddConfirmation = {
  created: boolean
  kind: MediaKind
  status: MovieStatus | BookStatus
  title: string
}
type BookSearchResult = {
  provider: string
  providerId: string
  title: string
  authors: string[] | string
  year: number | string | null
  coverUrl: string | null
}
const SearchContext = createContext<SearchContextValue | null>(null)

export function useMediaSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error("useMediaSearch must be used within MediaSearchProvider")
  return context
}

export function MediaSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<SearchScope>("all")
  const [query, setQuery] = useState("")
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([])
  const [searchError, setSearchError] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, startAdding] = useTransition()
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null)
  const [addConfirmation, setAddConfirmation] = useState<AddConfirmation | null>(null)
  const dismissAddConfirmation = useCallback(() => setAddConfirmation(null), [])
  const deferredQuery = useDeferredValue(query)
  const inputRef = useRef<HTMLInputElement>(null)

  const normalizedQuery = deferredQuery.trim()
  const results = normalizedQuery.length >= 2 ? remoteResults : []

  useEffect(() => {
    const searchQuery = deferredQuery.trim()
    if (searchQuery.length < 2) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsSearching(true)
      setSearchError("")
      setRemoteResults([])

      const searches: Array<Promise<{ results: SearchResult[]; error?: string }>> = []

      if (scope !== "book") {
        searches.push((async () => {
          try {
            const response = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal })
            const data = await response.json().catch(() => null)
            if (!response.ok) return { results: [], error: data?.error ?? "Movie search is unavailable." }

            return {
              results: (data?.results ?? []).map((movie: { tmdbId: number; title: string; year: string; posterUrl: string | null }) => ({
                id: String(movie.tmdbId),
                kind: "movie" as const,
                title: movie.title,
                credit: "TMDB",
                year: movie.year,
                artwork: movie.posterUrl,
              })).slice(0, scope === "all" ? 4 : 8),
            }
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") throw error
            return { results: [], error: "Movie search is unavailable." }
          }
        })())
      }

      if (scope !== "movie") {
        searches.push((async () => {
          try {
            const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal })
            const data = await response.json().catch(() => null)
            if (!response.ok) return { results: [], error: data?.error ?? "Book search is unavailable." }

            return {
              results: (data?.results ?? []).map((book: BookSearchResult) => ({
                id: book.providerId,
                kind: "book" as const,
                title: book.title,
                credit: Array.isArray(book.authors) ? book.authors.join(", ") : book.authors,
                year: book.year == null ? "" : String(book.year),
                artwork: book.coverUrl,
                provider: book.provider,
              })).slice(0, scope === "all" ? 4 : 8),
            }
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") throw error
            return { results: [], error: "Book search is unavailable." }
          }
        })())
      }

      try {
        const searchResults = await Promise.all(searches)
        setRemoteResults(searchResults.flatMap((result) => result.results).slice(0, 8))
        setSearchError(searchResults.flatMap((result) => result.error ? [result.error] : []).join(" "))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setRemoteResults([])
        setSearchError(error instanceof Error ? error.message : "Search is unavailable.")
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [deferredQuery, scope])

  function openSearch(nextScope: SearchScope = "all") {
    setScope(nextScope)
    setQuery("")
    setRemoteResults([])
    setSearchError("")
    setOpen(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setQuery("")
  }

  function addMovie(tmdbId: number, title: string, status: MovieStatus) {
    setSearchError("")
    setPendingAdd({ id: String(tmdbId), kind: "movie", status })
    startAdding(async () => {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, status }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setPendingAdd(null)
        return setSearchError(data?.error ?? "The movie could not be added.")
      }
      setPendingAdd(null)
      setAddConfirmation({ created: data.created === true, kind: "movie", status, title })
      handleOpenChange(false)
      router.push(`/movies/${data.movie.id}`)
      router.refresh()
    })
  }

  function addBook(result: SearchResult, status: BookStatus) {
    if (result.kind !== "book" || !result.provider) return

    setSearchError("")
    setPendingAdd({ id: result.id, kind: "book", status })
    startAdding(async () => {
      try {
        const response = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: result.provider, providerId: result.id, status }),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) return setSearchError(data?.error ?? "The book could not be added.")

        setAddConfirmation({ created: data.created === true, kind: "book", status, title: result.title })
        handleOpenChange(false)
        router.push(`/books/${data.book.id}`)
        router.refresh()
      } catch {
        setSearchError("The book could not be added.")
      } finally {
        setPendingAdd(null)
      }
    })
  }

  const searchLabel = scope === "movie" ? "Search movies" : scope === "book" ? "Search books" : "Search movies and books"

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogBackdrop className="fixed inset-0 z-40 bg-white/65 backdrop-blur-[12px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <DialogViewport className="fixed inset-0 z-50 overflow-y-auto px-3 py-[10vh] sm:px-5 sm:py-[14vh]">
            <DialogPopup initialFocus={inputRef} className="relative mx-auto w-full max-w-[57rem] outline-none transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
              <DialogTitle className="sr-only">{searchLabel}</DialogTitle>
              <DialogDescription className="sr-only">Search by title, then add a movie or book to your collection.</DialogDescription>
              <div className="relative">
                <Input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={scope === "movie" ? "Search for your favorite movies" : scope === "book" ? "Search for your favorite books" : searchLabel} aria-label={searchLabel} autoComplete="off" className="h-[58px] rounded-[4px] border-0 bg-white px-[18px] pr-14 text-base tracking-[-0.01em] shadow-none placeholder:text-[#b5b5b5] focus-visible:ring-1 focus-visible:ring-white/60 sm:text-[17px]" />
                <DialogClose aria-label="Close search" className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-none text-[#111111] outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-1 focus-visible:ring-[#111111] active:scale-95">
                  <X aria-hidden="true" className="size-5" strokeWidth={2} />
                </DialogClose>
              </div>

              {normalizedQuery.length >= 2 ? (
                <div className="mt-5 max-h-[min(68vh,36rem)] overflow-y-auto bg-transparent" aria-live="polite">
                  {isSearching && !results.length ? (
                    <SearchResultSkeleton label={scope === "movie" ? "Searching movies" : scope === "book" ? "Searching books" : "Searching movies and books"} />
                  ) : results.length ? (
                    <ul className="space-y-1">
                      {results.map((result) => (
                        <li key={`${result.kind}-${result.id}`} className="overflow-hidden rounded-[4px] bg-white">
                          <div className="grid min-h-[84px] w-full grid-cols-[45px_minmax(0,1fr)] items-center gap-x-2 px-1.5 py-1.5 transition-colors duration-150 hover:bg-[#f8f8f7] sm:grid-cols-[45px_minmax(0,1fr)_auto]">
                            <span className="relative block h-[70px] w-[45px] overflow-hidden bg-[#242424]">
                              {result.artwork ? <Image src={result.artwork} alt={`${result.title} ${result.kind === "movie" ? "poster" : "cover"}`} fill sizes="45px" className="object-cover" /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[17px] leading-5 text-[#111111]">{result.title}</span>
                              <span className="block truncate text-[16px] leading-5 text-[#b5b5b5]">{result.credit} <span aria-hidden="true">|</span> {result.year}</span>
                            </span>
                            {result.kind === "movie" ? (
                              <span className="col-span-2 flex justify-end gap-4 px-1 pb-1 text-sm sm:col-span-1 sm:px-0 sm:pb-0 sm:pr-0.5 sm:text-base">
                                <button type="button" disabled={isAdding} onClick={() => addMovie(Number(result.id), result.title, "watchlist")} className="ledger-focus whitespace-nowrap transition-colors duration-150 hover:text-[#686868] disabled:opacity-50">
                                  {isAdding && pendingAdd?.kind === "movie" && pendingAdd.id === result.id && pendingAdd.status === "watchlist" ? <span role="status" aria-label="Adding to Watchlist" className="block h-2 w-24 animate-pulse bg-[#bdbdbd]" /> : "Add to watchlist"}
                                </button>
                                <button type="button" disabled={isAdding} onClick={() => addMovie(Number(result.id), result.title, "watched")} className="ledger-focus whitespace-nowrap text-[#686868] transition-colors duration-150 hover:text-[#111111] disabled:opacity-50">
                                  {isAdding && pendingAdd?.kind === "movie" && pendingAdd.id === result.id && pendingAdd.status === "watched" ? <span role="status" aria-label="Adding to Watched" className="block h-2 w-16 animate-pulse bg-[#bdbdbd]" /> : "Watched"}
                                </button>
                              </span>
                            ) : (
                              <span className="col-span-2 flex justify-end gap-4 px-1 pb-1 text-sm sm:col-span-1 sm:px-0 sm:pb-0 sm:pr-0.5 sm:text-base">
                                <button type="button" disabled={isAdding} onClick={() => addBook(result, "want_to_read")} className="ledger-focus whitespace-nowrap transition-colors duration-150 hover:text-[#686868] disabled:opacity-50">
                                  {isAdding && pendingAdd?.kind === "book" && pendingAdd.id === result.id && pendingAdd.status === "want_to_read" ? <span role="status" aria-label="Adding to Want to read" className="block h-2 w-24 animate-pulse bg-[#bdbdbd]" /> : "Add to reading list"}
                                </button>
                                <button type="button" disabled={isAdding} onClick={() => addBook(result, "read")} className="ledger-focus whitespace-nowrap text-[#686868] transition-colors duration-150 hover:text-[#111111] disabled:opacity-50">
                                  {isAdding && pendingAdd?.kind === "book" && pendingAdd.id === result.id && pendingAdd.status === "read" ? <span role="status" aria-label="Adding to Read" className="block h-2 w-10 animate-pulse bg-[#bdbdbd]" /> : "Read"}
                                </button>
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-[4px] bg-white px-4 py-5 text-sm text-[#686868]">No matching {scope === "all" ? "movies or books" : `${scope}s`}.</p>
                  )}
                  {searchError ? <p role="alert" className="mt-1 rounded-[4px] bg-white px-4 py-3 text-sm text-red-700">{searchError}</p> : null}
                </div>
              ) : null}
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>
      {addConfirmation ? (
        <MovieAddConfirmation
          created={addConfirmation.created}
          kind={addConfirmation.kind}
          status={addConfirmation.status}
          title={addConfirmation.title}
          onDismiss={dismissAddConfirmation}
        />
      ) : null}
    </SearchContext.Provider>
  )
}
