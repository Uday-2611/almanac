import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**", search: "" },
      { protocol: "https", hostname: "covers.openlibrary.org", pathname: "/b/**", search: "?default=false" },
      { protocol: "https", hostname: "books.google.com", pathname: "/books/content" },
      { protocol: "https", hostname: "books.googleusercontent.com", pathname: "/books/content" },
    ],
  },
};

export default nextConfig;
