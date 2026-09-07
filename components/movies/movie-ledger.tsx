import Link from "next/link";

import { AnimatedLedgerList, type AnimatedLedgerItem } from "@/components/ledger/animated-ledger-list";
import { AnimatedMoviePoster } from "@/components/movies/animated-movie-poster";
import { MovieListDisclosure } from "@/components/movies/movie-list-disclosure";
import { MoviePosterRail } from "@/components/movies/movie-poster-rail";
import { CreateMovieListForm } from "@/components/movies/create-movie-list-form";
import { SearchTrigger } from "@/components/search/search-trigger";
import { EmptyState } from "@/components/states/empty-state";

export type MovieStatus = "watchlist" | "watched" | "lists";
export type MovieView = "images" | "list";

export type Movie = {
  id: string;
  title: string;
  director: string;
  date: string;
  posterUrl: string | null;
};

export type MovieList = {
  id: string;
  title: string;
  date: string;
  movies: Movie[];
};

function hrefFor(status: MovieStatus, view: MovieView) {
  return { pathname: "/movies", query: { status, view } };
}

function TextToggle({
  label,
  options,
  active,
}: {
  label: string;
  options: { label: string; href: ReturnType<typeof hrefFor>; value: string }[];
  active: string;
}) {
  return (
    <nav aria-label={label} className="flex items-center whitespace-nowrap">
      {options.map((option, index) => (
        <span key={option.value} className="flex items-center">
          {index > 0 ? <span aria-hidden="true" className="mx-1 text-[#111111]">/</span> : null}
          <Link
            href={option.href}
            aria-current={option.value === active ? "page" : undefined}
            className={option.value === active ? "ledger-focus text-[#111111]" : "ledger-focus text-[#686868] hover:text-[#111111]"}
          >
            {option.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function MovieToolbar({ status, view }: { status: MovieStatus; view: MovieView }) {
  return (
    <div className="absolute left-4 right-4 top-14 z-10 flex justify-between gap-2 text-[11px] leading-none sm:left-5 sm:right-5 sm:top-5 sm:justify-end sm:text-base md:gap-[clamp(3rem,15vw,12.25rem)]">
      <TextToggle
        label="Movie display"
        active={view}
        options={[
          { label: "Image View", value: "images", href: hrefFor(status, "images") },
          { label: "List View", value: "list", href: hrefFor(status, "list") },
        ]}
      />
      <TextToggle
        label="Movie collection"
        active={status}
        options={[
          { label: "Watchlist", value: "watchlist", href: hrefFor("watchlist", view) },
          { label: "Watched", value: "watched", href: hrefFor("watched", view) },
          { label: "My Lists", value: "lists", href: hrefFor("lists", view) },
        ]}
      />
    </div>
  );
}

function AddLink({ lists, view }: { lists?: boolean; view: MovieView }) {
  if (!lists) {
    return <SearchTrigger label="Add New +" scope="movie" className="inline-flex text-sm sm:text-base" />;
  }

  return (
    <Link href={{ pathname: "/movies", query: { status: "lists", view, new: "list" } }} className="ledger-focus inline-flex items-center gap-1 text-sm sm:text-base">
      Create new list
      <span aria-hidden="true" className="text-lg leading-none">+</span>
    </Link>
  );
}

function toLedgerItems(movies: Movie[]): AnimatedLedgerItem[] {
  return movies.map((movie) => ({
    id: movie.id,
    href: `/movies/${movie.id}`,
    date: movie.date,
    title: movie.title,
    creator: movie.director,
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
      director={movie.director}
      href={`/movies/${movie.id}`}
      posterUrl={movie.posterUrl}
      title={movie.title}
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

function ListsView({ lists, view }: { lists: MovieList[]; view: MovieView }) {
  return (
    <div className="mt-[29px] space-y-[55px] px-3 sm:space-y-[56px]">
      {lists.map((list) => (
        <MovieListDisclosure key={list.id} date={list.date} id={list.id} title={list.title}>
          {view === "images" ? (
            list.movies.length ? <MovieImageView movies={list.movies} /> : <p className="ml-0 mt-6 text-sm text-[#686868] sm:ml-[3.75rem]">No watched movies in this list yet.</p>
          ) : (
            list.movies.length ? (
              <AnimatedLedgerList
                items={toLedgerItems(list.movies)}
                className="ml-0 mt-[25px] max-w-[44rem] border-l border-[#dedede] pl-5 sm:ml-[3.75rem]"
              />
            ) : <p className="ml-0 mt-6 text-sm text-[#686868] sm:ml-[3.75rem]">No watched movies in this list yet.</p>
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
}: {
  status: MovieStatus;
  view: MovieView;
  movies: Movie[];
  lists: MovieList[];
  showCreateList: boolean;
}) {
  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 pb-16 pt-[192px] sm:px-5 sm:pt-[195px]">
      <h1 className="sr-only">Movies</h1>
      <MovieToolbar status={status} view={view} />
      <AddLink lists={status === "lists"} view={view} />
      {showCreateList ? <CreateMovieListForm /> : null}
      {status === "lists" ? (
        lists.length ? <ListsView lists={lists} view={view} /> : <div className="mt-8 text-[#686868]"><EmptyState message="No lists yet. Create one to organize movies you have watched." /></div>
      ) : movies.length ? (
        view === "images" ? <MovieImageView movies={movies} /> : <MovieListView movies={movies} />
      ) : (
        <div className="mt-8 text-[#686868]"><EmptyState message={status === "watchlist" ? "Your watchlist is empty." : "You have not marked any movies as watched yet."} /></div>
      )}
    </main>
  );
}
