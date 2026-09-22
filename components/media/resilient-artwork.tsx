"use client";

import { useState } from "react";
import Image from "next/image";

function supportedSource(source: string | null): source is string {
  if (!source) return false;
  if (source.startsWith("/") && !source.startsWith("//")) return true;

  try {
    const url = new URL(source);
    if (url.protocol !== "https:") return false;
    if (url.hostname === "image.tmdb.org") return url.pathname.startsWith("/t/p/");
    if (url.hostname === "covers.openlibrary.org") return url.pathname.startsWith("/b/") && url.search === "?default=false";
    if (url.hostname === "books.google.com") return url.pathname === "/books/content" || url.pathname === "/books/publisher/content";
    if (url.hostname === "books.googleusercontent.com") return url.pathname === "/books/content";
  } catch {
    return false;
  }

  return false;
}

export function ResilientArtwork({
  alt,
  className,
  compact = false,
  fallbackClassName = "",
  preload = false,
  sizes,
  src,
  title,
}: {
  alt: string;
  className: string;
  compact?: boolean;
  fallbackClassName?: string;
  preload?: boolean;
  sizes: string;
  src: string | null;
  title: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (supportedSource(src) && failedSource !== src) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} preload={preload} onError={() => setFailedSource(src)} />;
  }

  return (
    <span className={`absolute inset-0 flex items-center justify-center text-center font-medium [overflow-wrap:anywhere] ${compact ? "px-1 text-[9px] leading-3" : "px-5 text-sm leading-5"} ${fallbackClassName}`}>
      {compact ? "No image" : title}
    </span>
  );
}
