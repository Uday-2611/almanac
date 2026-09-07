"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { createContext, useContext, useDeferredValue, useEffect, useRef, useState, useTransition, type ReactNode } from "react"

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
import { searchCatalog, type MediaSearchResult, type SearchScope } from "@/lib/search/catalog"

type SearchContextValue = { openSearch: (scope?: SearchScope) => void }
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
  const [remoteResults, setRemoteResults] = useState<MediaSearchResult[]>([])
  const [searchError, setSearchError] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, startAdding] = useTransition()
  const deferredQuery = useDeferredValue(query)
  const inputRef = useRef<HTMLInputElement>(null)

  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase()
  const localBookResults = normalizedQuery && scope !== "movie"
    ? searchCatalog
        .filter((item) => item.kind === "book")
        .filter((item) => `${item.title} ${item.credit} ${item.year}`.toLocaleLowerCase().includes(normalizedQuery))
        .slice(0, scope === "all" ? 3 : 7)
    : []
  const movieResults = scope === "book" || normalizedQuery.length < 2 ? [] : remoteResults
  const results = normalizedQuery ? [...movieResults, ...localBookResults].slice(0, 8) : []

  useEffect(() => {
    if (deferredQuery.trim().length < 2 || scope === "book") return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsSearching(true)
      setSearchError("")
      try {
        const response = await fetch(`/api/movies/search?q=${encodeURIComponent(deferredQuery.trim())}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? "Movie search is unavailable.")
        setRemoteResults(data.results.map((movie: { tmdbId: number; title: string; year: string; posterUrl: string | null }) => ({
          id: String(movie.tmdbId),
          kind: "movie" as const,
          title: movie.title,
          credit: "TMDB",
          year: movie.year,
          artwork: movie.posterUrl,
        })))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setRemoteResults([])
        setSearchError(error instanceof Error ? error.message : "Movie search is unavailable.")
      } finally {
        setIsSearching(false)
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

  function openBook(id: string) {
    router.push(`/books/${id}`)
    handleOpenChange(false)
  }

  function addMovie(tmdbId: number, status: "watchlist" | "watched") {
    setSearchError("")
    startAdding(async () => {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, status }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) return setSearchError(data?.error ?? "The movie could not be added.")
      handleOpenChange(false)
      router.push(`/movies/${data.movie.id}`)
      router.refresh()
    })
  }

  const searchLabel = scope === "movie" ? "Search movies" : scope === "book" ? "Search books" : "Search movies and books"

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogBackdrop className="fixed inset-0 z-40 bg-white/45 backdrop-blur-[10px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <DialogViewport className="fixed inset-0 z-50 overflow-y-auto px-4 py-[16vh] sm:px-6 sm:py-[19vh]">
            <DialogPopup initialFocus={inputRef} className="relative mx-auto w-full max-w-[46rem] outline-none transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
              <DialogTitle className="sr-only">{searchLabel}</DialogTitle>
              <DialogDescription className="sr-only">Search by title, then add a movie to Watchlist or Watched.</DialogDescription>
              <div className="relative bg-white">
                <Input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchLabel} aria-label={searchLabel} autoComplete="off" className="h-14 rounded-none border-0 border-b border-[#111111] bg-white px-0 pr-14 text-lg tracking-[-0.02em] shadow-none placeholder:text-[#686868] focus-visible:border-[#111111] focus-visible:ring-0 md:text-lg" />
                <DialogClose className="ledger-focus absolute right-0 top-1/2 -translate-y-1/2 text-sm text-[#686868] hover:text-[#111111]">Close</DialogClose>
              </div>

              {normalizedQuery ? (
                <div className="mt-3 max-h-[min(56vh,32rem)] overflow-y-auto border-y border-[#dedede] bg-white" aria-live="polite">
                  {results.length ? (
                    <ul>
                      {results.map((result) => (
                        <li key={`${result.kind}-${result.id}`} className="border-b border-[#eeeeee] last:border-b-0">
                          <div className="grid min-h-[78px] w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-[#fafafa] sm:grid-cols-[46px_minmax(0,1fr)_4rem_auto] sm:px-4">
                            <span className="relative block h-[52px] w-[38px] overflow-hidden bg-[#eeeeee]">
                              {result.artwork ? <Image src={result.artwork} alt={`${result.title} ${result.kind === "movie" ? "poster" : "cover"}`} fill sizes="38px" className="object-cover" /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-[#111111]">{result.title}</span>
                              <span className="block truncate text-sm text-[#686868]">{result.kind === "movie" ? "Source" : "Author"} / {result.credit}</span>
                            </span>
                            <span className="justify-self-end font-mono text-sm text-[#686868]">{result.year}</span>
                            {result.kind === "movie" ? (
                              <span className="col-span-3 flex justify-end gap-3 text-xs sm:col-span-1">
                                <button type="button" disabled={isAdding} onClick={() => addMovie(Number(result.id), "watchlist")} className="ledger-focus underline underline-offset-4 disabled:opacity-50">Watchlist</button>
                                <button type="button" disabled={isAdding} onClick={() => addMovie(Number(result.id), "watched")} className="ledger-focus underline underline-offset-4 disabled:opacity-50">Watched</button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => openBook(result.id)} className="ledger-focus col-span-3 justify-self-end text-xs underline underline-offset-4 sm:col-span-1">Open</button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : isSearching ? (
                    <p className="px-4 py-5 text-sm text-[#686868]">Searching TMDB...</p>
                  ) : (
                    <p className="px-4 py-5 text-sm text-[#686868]">No matching {scope === "all" ? "movies or books" : `${scope}s`}.</p>
                  )}
                  {searchError ? <p role="alert" className="border-t border-[#eeeeee] px-4 py-3 text-sm text-red-700">{searchError}</p> : null}
                </div>
              ) : null}
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>
    </SearchContext.Provider>
  )
}
