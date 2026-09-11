import {
  normalizeTmdbSearchResults,
  normalizeTmdbTitleDetails,
} from "../lib/providers/tmdb-normalize.ts";

const results = normalizeTmdbSearchResults([
  {
    id: 101,
    media_type: "movie",
    title: "A Film",
    overview: "Film overview",
    poster_path: "/film.jpg",
    backdrop_path: null,
    release_date: "2024-03-01",
  },
  {
    id: 101,
    media_type: "tv",
    name: "A Series",
    overview: "Series overview",
    poster_path: "/series.jpg",
    backdrop_path: null,
    first_air_date: "2022-06-10",
  },
  {
    id: 999,
    media_type: "person",
    name: "Not a title",
    overview: "",
    poster_path: null,
    backdrop_path: null,
  },
]);

if (results.length !== 2) throw new Error("Multi-search did not filter person results.");
if (results[0].mediaType !== "movie" || results[0].title !== "A Film" || results[0].year !== "2024") {
  throw new Error("Movie search normalization failed.");
}
if (results[1].mediaType !== "tv" || results[1].title !== "A Series" || results[1].year !== "2022") {
  throw new Error("TV search normalization failed.");
}

const movie = normalizeTmdbTitleDetails({
  id: 101,
  title: "A Film",
  overview: "Film overview",
  poster_path: "/film.jpg",
  backdrop_path: "/film-wide.jpg",
  release_date: "2024-03-01",
  runtime: 118,
  credits: {
    cast: [{ name: "Second", order: 2 }, { name: "First", order: 1 }],
    crew: [{ job: "Director", name: "Film Director" }],
  },
}, "movie");

if (movie.creator !== "Film Director" || movie.runtimeMinutes !== 118 || movie.cast[0] !== "First") {
  throw new Error("Movie detail normalization failed.");
}

const tv = normalizeTmdbTitleDetails({
  id: 101,
  name: "A Series",
  overview: "Series overview",
  poster_path: "/series.jpg",
  backdrop_path: "/series-wide.jpg",
  first_air_date: "2022-06-10",
  created_by: [{ name: "Creator One" }, { name: "Creator Two" }],
  episode_run_time: [0, 52],
  credits: {
    cast: [{ name: "Lead", order: 0 }],
    crew: [],
  },
}, "tv");

if (tv.creator !== "Creator One, Creator Two" || tv.runtimeMinutes !== 52 || tv.releaseDate !== "2022-06-10") {
  throw new Error("TV detail normalization failed.");
}

console.log("TMDB movie and TV normalization verified.");
