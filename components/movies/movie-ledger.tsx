"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AnimatedLedgerList, type AnimatedLedgerItem } from "@/components/ledger/animated-ledger-list";
import { CollectionHeading } from "@/components/ledger/collection-heading";
import { InfiniteArtworkCanvas } from "@/components/ledger/infinite-artwork-canvas";
import { PendingNavigationLink } from "@/components/ledger/pending-navigation-link";
import { AnimatedMoviePoster } from "@/components/movies/animated-movie-poster";
import { MovieListDisclosure } from "@/components/movies/movie-list-disclosure";
import { MoviePosterRail } from "@/components/movies/movie-poster-rail";
import { CreateMovieListForm } from "@/components/movies/create-movie-list-form";
import { SearchTrigger } from "@/components/search/search-trigger";
import { EmptyState } from "@/components/states/empty-state";
import { TagFilter, type TagFilterOption } from "@/components/media/tag-filter";

export type MovieStatus = "watchlist" | "watched" | "lists";
export type MovieView = "images" | "list" | "canvas";

export type Movie = {
  id: string;
  title: string;
  creator: string;
  mediaType: "movie" | "tv";
  date: string;
  group: string;
  sortDate: string;
  posterUrl: string | null;
  tags: string[];
};

export type MovieList = {
  id: string;
  title: string;
  date: string;
  movies: Movie[];
};

function hrefFor(status: MovieStatus, view: MovieView, tag?: string) {
  return { pathname: "/movies", query: { status, view, ...(tag ? { tag } : {}) } };
}

function TextToggle({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: { label: string; href: ReturnType<typeof hrefFor>; value: string }[];
  active: string;
  onChange?: (value: string) => void;
}) {
  return (
    <nav aria-label={label} className="flex min-h-10 items-center whitespace-nowrap sm:min-h-0">
      {options.map((option, index) => (
        <span key={option.value} className="flex items-center">
          {index > 0 ? <span aria-hidden="true" className="mx-1 text-[#111111]">/</span> : null}
          {onChange ? (
            <button
              type="button"
              aria-pressed={option.value === active}
              className={option.value === active ? "ledger-focus text-[#111111]" : "ledger-focus text-[#686868] hover:text-[#111111]"}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ) : (
            <PendingNavigationLink
              href={option.href}
              active={option.value === active}
              pendingLabel={`Loading ${option.label}`}
            >
              {option.label}
            </PendingNavigationLink>
          )}
        </span>
      ))}
    </nav>
  );
}

function MovieToolbar({ status, view, tag, onViewChange }: { status: MovieStatus; view: MovieView; tag?: string; onViewChange: (view: MovieView) => void }) {
  return (
    <div className="absolute left-4 right-4 top-16 z-10 flex flex-col items-start gap-1 text-[13px] leading-none sm:left-5 sm:right-5 sm:top-5 sm:flex-row sm:items-stretch sm:justify-end sm:gap-2 sm:text-base md:gap-[clamp(3rem,15vw,12.25rem)]">
      <TextToggle
        label="Movie and TV display"
        active={view}
        onChange={(value) => onViewChange(value as MovieView)}
        options={[
          { label: "Image View", value: "images", href: hrefFor(status, "images", tag) },
          { label: "List View", value: "list", href: hrefFor(status, "list", tag) },
          { label: "Canvas View", value: "canvas", href: hrefFor(status, "canvas", tag) },
        ]}
      />
      <TextToggle
        label="Movie and TV collection"
        active={status}
        options={[
          { label: "Watchlist", value: "watchlist", href: hrefFor("watchlist", view, tag) },
          { label: "Watched", value: "watched", href: hrefFor("watched", view, tag) },
          { label: "My Lists", value: "lists", href: hrefFor("lists", view) },
        ]}
      />
    </div>
  );
}

function AddLink({ lists, view }: { lists?: boolean; view: MovieView }) {
  if (!lists) {
    return <SearchTrigger label="Search" scope="movie" className="inline-flex text-sm sm:text-base" />;
  }

  return (
    <Link href={{ pathname: "/movies", query: { status: "lists", view, new: "list" } }} className="ledger-focus inline-flex items-center gap-1 text-sm sm:text-base">
      Create new list
      <span aria-hidden="true" className="text-lg leading-none">+</span>
    </Link>
  );
}

function toLedgerItems(movies: Movie[]): AnimatedLedgerItem[] {
  return [...movies].sort((a, b) => b.sortDate.localeCompare(a.sortDate)).map((movie) => ({
    id: movie.id,
    href: `/movies/${movie.id}`,
    date: movie.date,
    group: movie.group,
    title: movie.title,
    creator: movie.creator,
    tags: movie.tags,
  }));
}

function MovieListView({ movies }: { movies: Movie[] }) {
  return (
    <AnimatedLedgerList
      items={toLedgerItems(movies)}
      className="mt-[23px] w-full max-w-[44rem] pl-3"
    />
  );
}

function Poster({ movie }: { movie: Movie }) {
  return (
    <AnimatedMoviePoster
      creator={movie.creator}
      href={`/movies/${movie.id}`}
      posterUrl={movie.posterUrl}
      title={movie.title}
      mediaType={movie.mediaType}
      tags={movie.tags}
    />
  );
}

function MovieImageView({ movies }: { movies: Movie[] }) {
  return (
    <MoviePosterRail>
      <ul className="mt-[6px] flex w-max gap-1 px-3 pb-3">
        {movies.map((movie) => <Poster key={movie.id} movie={movie} />)}
      </ul>
    </MoviePosterRail>
  );
}

function MovieCanvasView({ movies, inList = false }: { movies: Movie[]; inList?: boolean }) {
  return <InfiniteArtworkCanvas kind="movie" items={movies.map((movie) => ({ id: movie.id, title: movie.title, creator: movie.creator, imageUrl: movie.posterUrl }))} className={inList ? "mt-6 h-[min(68dvh,620px)] min-h-[360px]" : "h-[calc(100dvh-132px)] min-h-[360px] sm:h-[calc(100dvh-82px)]"} />;
}

function ListsView({ lists, view }: { lists: MovieList[]; view: MovieView }) {
  return (
    <div className="mt-[29px] space-y-[55px] px-3 sm:space-y-[56px]">
      {lists.map((list) => (
        <MovieListDisclosure key={list.id} date={list.date} id={list.id} title={list.title}>
          {view === "canvas" ? (
            list.movies.length ? <MovieCanvasView movies={list.movies} inList /> : <p className="ml-0 mt-6 text-sm text-[#686868] sm:ml-[3.75rem]">No watched titles in this list yet.</p>
          ) : view === "images" ? (
            list.movies.length ? <MovieImageView movies={list.movies} /> : <p className="ml-0 mt-6 text-sm text-[#686868] sm:ml-[3.75rem]">No watched titles in this list yet.</p>
          ) : (
            list.movies.length ? (
              <AnimatedLedgerList
                items={toLedgerItems(list.movies)}
                className="ml-0 mt-[25px] max-w-[44rem] border-l border-[#dedede] pl-5 sm:ml-[3.75rem]"
              />
            ) : <p className="ml-0 mt-6 text-sm text-[#686868] sm:ml-[3.75rem]">No watched titles in this list yet.</p>
          )}
        </MovieListDisclosure>
      ))}
    </div>
  );
}

export function MovieLedger({
  status,
  view,
  movies,
  lists,
  showCreateList,
  activeTagId,
  tagOptions,
}: {
  status: MovieStatus;
  view: MovieView;
  movies: Movie[];
  lists: MovieList[];
  showCreateList: boolean;
  activeTagId?: string;
  tagOptions: TagFilterOption[];
}) {
  const searchParams = useSearchParams();
  const queryView = searchParams.get("view");
  const activeView: MovieView = queryView === "images" || queryView === "list" || queryView === "canvas" ? queryView : view;
  const activeTagName = tagOptions.find((tag) => tag.id === activeTagId)?.name;
  const showCanvas = activeView === "canvas" && status !== "lists" && movies.length > 0;

  function changeView(nextView: MovieView) {
    if (nextView === activeView) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    window.history.pushState(null, "", `?${params.toString()}`);
  }

  return (
    <main className={showCanvas ? "relative min-h-dvh overflow-hidden pt-[132px] sm:pt-[82px]" : "relative min-h-screen overflow-x-hidden px-4 pb-16 pt-[210px] sm:px-5 sm:pt-[195px]"}>
      <h1 className="sr-only">Movies and TV shows</h1>
      <MovieToolbar status={status} view={activeView} tag={activeTagId} onViewChange={changeView} />
      {showCanvas ? null : <AddLink lists={status === "lists"} view={activeView} />}
      {status !== "lists" && !showCanvas ? <TagFilter activeTagId={activeTagId} pathname="/movies" query={{ status, view: activeView }} tags={tagOptions} /> : null}
      {showCreateList ? <CreateMovieListForm /> : null}
      {showCanvas ? null : <CollectionHeading label={status === "lists" ? "My Lists" : status === "watchlist" ? "Watchlist" : "Watched"} count={status === "lists" ? lists.length : movies.length} noun={status === "lists" ? "list" : "title"} />}
      {status === "lists" ? (
        lists.length ? <ListsView lists={lists} view={activeView} /> : <div className="mt-8 text-[#686868]"><EmptyState message="No lists yet. Create one to organize movies and TV shows you have watched." /></div>
      ) : movies.length ? (
        activeView === "canvas" ? <MovieCanvasView movies={movies} /> : activeView === "images" ? <MovieImageView movies={movies} /> : <MovieListView movies={movies} />
      ) : (
        <div className="mt-8 text-[#686868]"><EmptyState message={activeTagName ? `No ${status === "watchlist" ? "watchlist" : "watched"} titles use the tag “${activeTagName}”. Choose All above to see the full collection.` : status === "watchlist" ? "Your watchlist is empty. Search for a movie or show to save it here." : "No watched titles yet. Search for a movie or show to begin your record."} /></div>
      )}
    </main>
  );
}
