"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";

import { ResilientArtwork } from "@/components/media/resilient-artwork";

export type CanvasArtwork = {
  id: string;
  title: string;
  creator: string;
  imageUrl: string | null;
};

type Point = { x: number; y: number };

function wrap(value: number, length: number) {
  return ((value % length) + length) % length;
}

export function InfiniteArtworkCanvas({
  items,
  kind,
  className = "",
}: {
  items: CanvasArtwork[];
  kind: "movie" | "book";
  className?: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; last: Point; start: Point; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState<Point>({ x: -110, y: -95 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => setSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? canvas.clientHeight : 1;
      setPosition((current) => ({ x: current.x - event.deltaX * unit, y: current.y - event.deltaY * unit }));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    suppressClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      last: { x: event.clientX, y: event.clientY },
      moved: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - current.start.x, event.clientY - current.start.y);
    if (!current.moved && distance < 6) return;
    if (!current.moved) {
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const deltaX = event.clientX - current.last.x;
    const deltaY = event.clientY - current.last.y;
    current.last = { x: event.clientX, y: event.clientY };
    setPosition((value) => ({ x: value.x + deltaX, y: value.y + deltaY }));
  }

  function endPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const artworkWidth = size.width < 640 ? 132 : size.width < 1100 ? 190 : 244;
  const artworkHeight = artworkWidth * 1.5;
  const stepX = artworkWidth + (size.width < 640 ? 12 : 20);
  const stepY = artworkHeight + (size.width < 640 ? 16 : 24);
  const firstColumn = Math.floor(-position.x / stepX) - 1;
  const lastColumn = Math.ceil((size.width - position.x) / stepX) + 1;
  const firstRow = Math.floor((-position.y - stepY) / stepY) - 1;
  const lastRow = Math.ceil((size.height - position.y) / stepY) + 1;
  const tiles = [];

  if (size.width && size.height && items.length) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const stagger = wrap(column, 3) * stepY / 3;
      for (let row = firstRow; row <= lastRow; row += 1) {
        const left = column * stepX + position.x;
        const top = row * stepY + stagger + position.y;
        if (left >= size.width || left + artworkWidth <= 0 || top >= size.height || top + artworkHeight <= 0) continue;
        const item = items[wrap(column * 31 + row * 17, items.length)];
        tiles.push(
          <Link
            key={`${column}:${row}`}
            href={`/${kind === "movie" ? "movies" : "books"}/${item.id}`}
            prefetch={false}
            draggable={false}
            aria-label={`${item.title}, ${kind === "book" ? `by ${item.creator}` : item.creator}`}
            className="ledger-focus absolute block overflow-hidden rounded-[4px] bg-[#efefec] focus-visible:z-10"
            style={{ left, top, width: artworkWidth, height: artworkHeight }}
            onDragStart={(event) => event.preventDefault()}
          >
            <ResilientArtwork
              src={kind === "book" ? item.imageUrl?.replace(/-M\.jpg(?=\?|$)/, "-L.jpg") ?? null : item.imageUrl}
              alt={`${item.title} ${kind === "book" ? "book cover" : "poster"}`}
              sizes={`${artworkWidth}px`}
              className={kind === "book" ? "object-contain" : "object-cover"}
              title={item.title}
              fallbackClassName="text-[#111111]"
            />
          </Link>,
        );
      }
    }
  }

  return (
    <div
      ref={canvasRef}
      role="region"
      tabIndex={0}
      aria-label={`${kind === "movie" ? "Movies and TV shows" : "Books"} canvas. Drag, scroll, or use arrow keys to move in any direction. Select a cover to open its details.`}
      data-lenis-prevent-wheel
      className={`relative cursor-grab touch-none select-none overflow-hidden bg-white active:cursor-grabbing ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }}
      onKeyDown={(event) => {
        const direction: Record<string, Point> = {
          ArrowLeft: { x: 80, y: 0 },
          ArrowRight: { x: -80, y: 0 },
          ArrowUp: { x: 0, y: 80 },
          ArrowDown: { x: 0, y: -80 },
        };
        const delta = direction[event.key];
        if (!delta || event.target !== event.currentTarget) return;
        event.preventDefault();
        setPosition((current) => ({ x: current.x + delta.x, y: current.y + delta.y }));
      }}
    >
      {tiles}
    </div>
  );
}
