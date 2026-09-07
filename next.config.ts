import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**", search: "" },
      { protocol: "https", hostname: "covers.openlibrary.org", pathname: "/b/**", search: "" },
    ],
  },
};

export default nextConfig;
