"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
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
import { SearchMediaPreview, type SearchMediaPreviewData } from "@/components/search/search-media-preview"
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
type BookSearchResult = {
  provider: string
  providerId: string
  title: string
  authors: string[] | string
  year: number | string | null
  coverUrl: string | null
}
type CachedSearch = { error: string; results: SearchResult[] }
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
  const [resultKey, setResultKey] = useState("")
  const [searchError, setSearchError] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchRevision, setSearchRevision] = useState(0)
  const [pendingAdds, setPendingAdds] = useState<Record<string, boolean>>({})
  const [addedStatuses, setAddedStatuses] = useState<Record<string, MovieStatus | BookStatus>>({})
  const [addedConfirmations, setAddedConfirmations] = useState<Record<string, boolean>>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLabel, setPreviewLabel] = useState("Media details")
  const [previewData, setPreviewData] = useState<SearchMediaPreviewData | null>(null)
  const [previewError, setPreviewError] = useState("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchCacheRef = useRef(new Map<string, CachedSearch>())
  const previewCacheRef = useRef(new Map<string, SearchMediaPreviewData>())
  const previewPromiseCacheRef = useRef(new Map<string, Promise<SearchMediaPreviewData>>())
  const activePreviewIdentityRef = useRef<string | null>(null)
  const hasMutatedRef = useRef(false)
  const confirmationTimersRef = useRef(new Map<string, number>())

  const normalizedQuery = query.trim()
  const activeSearchKey = `${scope}:${normalizedQuery.toLocaleLowerCase()}`
  const results = normalizedQuery.length >= 2 && resultKey === activeSearchKey ? remoteResults : []

  useEffect(() => () => {
    confirmationTimersRef.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    const searchQuery = query.trim()
    if (searchQuery.length < 2) return
    const cacheKey = `${scope}:${searchQuery.toLocaleLowerCase()}`
    const cached = searchCacheRef.current.get(cacheKey)
    if (cached) {
      setRemoteResults(cached.results)
      setResultKey(cacheKey)
      setSearchError(cached.error)
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setIsSearching(true)
      setSearchError("")

      const batches: Partial<Record<MediaKind, { results: SearchResult[]; error?: string }>> = {}
      const totalSearches = scope === "all" ? 2 : 1
      let completedSearches = 0

      function publish(kind: MediaKind, batch: { results: SearchResult[]; error?: string }) {
        if (controller.signal.aborted) return
        batches[kind] = batch
        completedSearches += 1
        const nextResults = [...(batches.movie?.results ?? []), ...(batches.book?.results ?? [])].slice(0, 8)
        const nextError = [batches.movie?.error, batches.book?.error].filter(Boolean).join(" ")
        setRemoteResults(nextResults)
        setResultKey(cacheKey)
        setSearchError(nextError)

        if (completedSearches === totalSearches) {
          if (!nextError) searchCacheRef.current.set(cacheKey, { error: "", results: nextResults })
          setIsSearching(false)
        }
      }

      if (scope !== "book") {
        void (async () => {
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
        })().then((batch) => publish("movie", batch)).catch(() => undefined)
      }

      if (scope !== "movie") {
        void (async () => {
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
        })().then((batch) => publish("book", batch)).catch(() => undefined)
      }
    }, 120)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query, scope, searchRevision])

  function retrySearch() {
    searchCacheRef.current.delete(activeSearchKey)
    setSearchRevision((current) => current + 1)
  }

  function openSearch(nextScope: SearchScope = "all") {
    setScope(nextScope)
    setQuery("")
    setRemoteResults([])
    setResultKey("")
    setSearchError("")
    setAddedStatuses({})
    hasMutatedRef.current = false
    setOpen(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery("")
      setPreviewOpen(false)
      activePreviewIdentityRef.current = null
      if (hasMutatedRef.current) {
        hasMutatedRef.current = false
        router.refresh()
      }
    }
  }

  function resultIdentity(result: SearchResult) {
    return `${result.kind}:${result.provider ?? "tmdb"}:${result.id}`
  }

  function addActionKey(identity: string, status: MovieStatus | BookStatus) {
    return `${identity}:${status}`
  }

  function setAddPending(key: string, pending: boolean) {
    setPendingAdds((current) => {
      const next = { ...current }
      if (pending) next[key] = true
      else delete next[key]
      return next
    })
  }

  function showAddedConfirmation(key: string) {
    const existingTimer = confirmationTimersRef.current.get(key)
    if (existingTimer) window.clearTimeout(existingTimer)
    setAddedConfirmations((current) => ({ ...current, [key]: true }))
    const timer = window.setTimeout(() => {
      setAddedConfirmations((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
      confirmationTimersRef.current.delete(key)
    }, 1_700)
    confirmationTimersRef.current.set(key, timer)
  }

  function previewPath(result: SearchResult) {
    return result.kind === "movie"
      ? `/api/movies/preview?tmdbId=${encodeURIComponent(result.id)}`
      : `/api/books/preview?provider=${encodeURIComponent(result.provider ?? "")}&providerId=${encodeURIComponent(result.id)}`
  }

  function loadPreview(result: SearchResult) {
    const identity = resultIdentity(result)
    const cached = previewCacheRef.current.get(identity)
    if (cached) return Promise.resolve(cached)
    const pending = previewPromiseCacheRef.current.get(identity)
    if (pending) return pending

    const request = (async () => {
      const response = await fetch(previewPath(result))
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Information is temporarily unavailable.")
      previewCacheRef.current.set(identity, data.preview)
      return data.preview as SearchMediaPreviewData
    })()

    previewPromiseCacheRef.current.set(identity, request)
    void request.then(
      () => previewPromiseCacheRef.current.delete(identity),
      () => previewPromiseCacheRef.current.delete(identity),
    )
    return request
  }

  function prefetchPreview(result: SearchResult) {
    void loadPreview(result).catch(() => undefined)
  }

  async function openPreview(result: SearchResult) {
    const identity = resultIdentity(result)
    activePreviewIdentityRef.current = identity
    setPreviewLabel(`${result.title} details`)
    setPreviewOpen(true)
    setPreviewError("")

    const cached = previewCacheRef.current.get(identity)
    setPreviewData(cached ?? null)
    setIsPreviewLoading(!cached)
    if (cached) return

    try {
      const preview = await loadPreview(result)
      if (activePreviewIdentityRef.current === identity) setPreviewData(preview)
    } catch (error) {
      if (activePreviewIdentityRef.current === identity) {
        setPreviewError(error instanceof Error ? error.message : "Information is temporarily unavailable.")
      }
    } finally {
      if (activePreviewIdentityRef.current === identity) setIsPreviewLoading(false)
    }
  }

  function addMovie(tmdbId: number, status: MovieStatus) {
    const identity = `movie:tmdb:${tmdbId}`
    const actionKey = addActionKey(identity, status)
    if (pendingAdds[actionKey]) return
    setSearchError("")
    setAddPending(actionKey, true)
    void (async () => {
      try {
        const response = await fetch("/api/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, status }),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) return setSearchError(data?.error ?? "The movie could not be added.")

        hasMutatedRef.current = true
        const savedStatus = data.movie.status as MovieStatus
        setAddedStatuses((current) => ({ ...current, [identity]: savedStatus }))
        showAddedConfirmation(addActionKey(identity, savedStatus))
      } catch {
        setSearchError("The movie could not be added.")
      } finally {
        setAddPending(actionKey, false)
      }
    })()
  }

  function addBook(result: SearchResult, status: BookStatus) {
    if (result.kind !== "book" || !result.provider) return

    const identity = resultIdentity(result)
    const actionKey = addActionKey(identity, status)
    if (pendingAdds[actionKey]) return
    setSearchError("")
    setAddPending(actionKey, true)
    void (async () => {
      try {
        const response = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: result.provider, providerId: result.id, status }),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) return setSearchError(data?.error ?? "The book could not be added.")

        hasMutatedRef.current = true
        const savedStatus = data.book.status as BookStatus
        setAddedStatuses((current) => ({ ...current, [identity]: savedStatus }))
        showAddedConfirmation(addActionKey(identity, savedStatus))
      } catch {
        setSearchError("The book could not be added.")
      } finally {
        setAddPending(actionKey, false)
      }
    })()
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
                <Input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={scope === "movie" ? "Search for your favorite movies" : scope === "book" ? "Search for your favorite books" : searchLabel} aria-label={searchLabel} autoComplete="off" className="h-[58px] rounded-[4px] border-0 bg-white px-[18px] pr-14 text-base tracking-[-0.01em] shadow-none placeholder:text-[#8a8a8a] focus-visible:bg-white sm:text-[17px]" />
                <DialogClose aria-label="Close search" className="ledger-focus absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-[#111111] hover:bg-black/[0.05] active:scale-95">
                  <X aria-hidden="true" className="size-5" strokeWidth={2} />
                </DialogClose>
              </div>

              {normalizedQuery.length >= 2 ? (
                <div className="mt-5 max-h-[min(68vh,36rem)] overflow-y-auto bg-transparent" aria-live="polite">
                  {(isSearching || resultKey !== activeSearchKey) && !results.length ? (
                    <SearchResultSkeleton label={scope === "movie" ? "Searching movies" : scope === "book" ? "Searching books" : "Searching movies and books"} />
                  ) : results.length ? (
                    <ul className="space-y-1">
                      {results.map((result) => {
                        const identity = resultIdentity(result)
                        const addedStatus = addedStatuses[identity]
                        const primaryStatus = result.kind === "movie" ? "watchlist" : "want_to_read"
                        const secondaryStatus = result.kind === "movie" ? "watched" : "read"
                        const primaryKey = addActionKey(identity, primaryStatus)
                        const secondaryKey = addActionKey(identity, secondaryStatus)
                        const itemIsAdding = Boolean(pendingAdds[primaryKey] || pendingAdds[secondaryKey])

                        return (
                          <li key={`${result.kind}-${result.id}`} className="overflow-visible rounded-[4px] bg-white">
                            <div className="grid min-h-[84px] w-full grid-cols-1 items-center rounded-[4px] px-1.5 py-1.5 transition-colors duration-150 hover:bg-[#f8f8f7] sm:grid-cols-[minmax(0,1fr)_auto]">
                              <button
                                type="button"
                                onClick={() => openPreview(result)}
                                onFocus={() => prefetchPreview(result)}
                                onPointerEnter={() => prefetchPreview(result)}
                                className="ledger-focus grid min-w-0 grid-cols-[45px_minmax(0,1fr)] items-center gap-x-2 text-left"
                                aria-label={`View ${result.title} information`}
                              >
                                <span className="relative block h-[70px] w-[45px] overflow-hidden rounded-[4px] bg-[#242424]">
                                  {result.artwork ? <Image src={result.artwork} alt="" fill sizes="45px" className="object-cover" /> : null}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-[18px] font-semibold leading-5 tracking-[-0.018em] text-[#111111]">{result.title}</span>
                                  <span className="block truncate text-[16px] leading-5 text-[#b5b5b5]">{result.credit} <span aria-hidden="true">|</span> {result.year}</span>
                                </span>
                              </button>
                              {result.kind === "movie" ? (
                                <span className="flex justify-end gap-4 px-1 pb-1 pt-4 text-sm sm:px-0 sm:pb-0 sm:pr-0.5 sm:pt-0 sm:text-base">
                                  <SearchAddAction added={addedStatus === "watchlist"} confirming={Boolean(addedConfirmations[primaryKey])} disabled={itemIsAdding || Boolean(addedStatus)} loading={Boolean(pendingAdds[primaryKey])} loadingLabel="Adding to Watchlist" onClick={() => addMovie(Number(result.id), "watchlist")}>Add to watchlist</SearchAddAction>
                                  <SearchAddAction added={addedStatus === "watched"} confirming={Boolean(addedConfirmations[secondaryKey])} disabled={itemIsAdding || Boolean(addedStatus)} loading={Boolean(pendingAdds[secondaryKey])} loadingLabel="Adding to Watched" muted onClick={() => addMovie(Number(result.id), "watched")}>Watched</SearchAddAction>
                                </span>
                              ) : (
                                <span className="flex justify-end gap-4 px-1 pb-1 pt-4 text-sm sm:px-0 sm:pb-0 sm:pr-0.5 sm:pt-0 sm:text-base">
                                  <SearchAddAction added={addedStatus === "want_to_read"} confirming={Boolean(addedConfirmations[primaryKey])} disabled={itemIsAdding || Boolean(addedStatus)} loading={Boolean(pendingAdds[primaryKey])} loadingLabel="Adding to Want to read" onClick={() => addBook(result, "want_to_read")}>Add to reading list</SearchAddAction>
                                  <SearchAddAction added={addedStatus === "read"} confirming={Boolean(addedConfirmations[secondaryKey])} disabled={itemIsAdding || Boolean(addedStatus)} loading={Boolean(pendingAdds[secondaryKey])} loadingLabel="Adding to Read" muted onClick={() => addBook(result, "read")}>Read</SearchAddAction>
                                </span>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : searchError ? (
                    <div role="alert" className="flex items-center justify-between gap-4 rounded-[4px] bg-white px-4 py-5 text-sm text-[#686868]">
                      <span>{searchError}</span>
                      <button type="button" onClick={retrySearch} className="ledger-focus shrink-0 font-medium text-[#111111] hover:bg-black/[0.05]">Retry</button>
                    </div>
                  ) : (
                    <p className="rounded-[4px] bg-white px-4 py-5 text-sm text-[#686868]">No matching {scope === "all" ? "movies or books" : `${scope}s`}.</p>
                  )}
                  {searchError && results.length ? <p role="alert" className="mt-1 rounded-[4px] bg-white px-4 py-3 text-sm text-red-700">{searchError}</p> : null}
                </div>
              ) : null}
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>
      <SearchMediaPreview
        data={previewData}
        error={previewError}
        label={previewLabel}
        loading={isPreviewLoading}
        onClose={() => {
          activePreviewIdentityRef.current = null
          setPreviewOpen(false)
        }}
        open={previewOpen}
      />
    </SearchContext.Provider>
  )
}

function SearchAddAction({ added, children, confirming, disabled, loading, loadingLabel, muted = false, onClick }: {
  added: boolean
  children: ReactNode
  confirming: boolean
  disabled: boolean
  loading: boolean
  loadingLabel: string
  muted?: boolean
  onClick: () => void
}) {
  return (
    <span className="relative flex min-w-max flex-col items-center">
      {confirming ? <span role="status" className="search-added-confirmation pointer-events-none absolute bottom-[calc(100%+0.35rem)] rounded-[4px] bg-[#111111] px-2 py-1 text-[10px] uppercase leading-none tracking-[0.1em] text-white">Added</span> : null}
      <button type="button" disabled={disabled} onClick={onClick} className={`ledger-focus whitespace-nowrap transition-colors duration-150 disabled:cursor-default ${added ? "text-[#b5b5b5]" : muted ? "text-[#686868] hover:text-[#111111]" : "hover:text-[#686868]"}`}>
        {loading ? <span role="status" aria-label={loadingLabel} className="block h-2 w-20 animate-pulse bg-[#bdbdbd]" /> : children}
      </button>
    </span>
  )
}
