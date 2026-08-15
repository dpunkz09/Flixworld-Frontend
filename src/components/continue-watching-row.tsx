"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X, Tv, Film } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getWatchProgressApi,
  deleteWatchProgressApi,
  type WatchProgressRecord,
} from "@/lib/watch-api";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

function getPosterUrl(record: WatchProgressRecord): string | null {
  const p = record.poster_path;
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${TMDB_IMG}${p.startsWith("/") ? "" : "/"}${p}`;
}

function getWatchHref(record: WatchProgressRecord): string {
  // Continue watching goes directly to the watch page; title not available here so bare id is fine
  if (record.type === "movie") return `/watch/movie/${record.tmdb_id}`;
  const s = record.season ?? 1;
  const e = record.episode ?? 1;
  return `/watch/tv/${record.tmdb_id}?season=${s}&episode=${e}`;
}

function formatProgress(pos: number, dur: number): string {
  if (!dur) return "";
  const left = dur - pos;
  if (left <= 0) return "Finished";
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

// ─── Individual card ──────────────────────────────────────────────────────────
function ContinueCard({
  record,
  onRemove,
}: {
  record: WatchProgressRecord;
  onRemove: (record: WatchProgressRecord) => void;
}) {
  const pct = record.duration_seconds > 0
    ? Math.min((record.position_seconds / record.duration_seconds) * 100, 100)
    : 0;
  const posterUrl = getPosterUrl(record);
  const href = getWatchHref(record);

  return (
    <div className="group relative flex-shrink-0 w-44 md:w-52">
      {/* Poster with progress overlay */}
      <Link href={href} className="block">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-white/30 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-black/60">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={record.title}
              fill
              sizes="(max-width: 768px) 176px, 208px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-800 text-zinc-500">
              {record.type === "tv" ? (
                <Tv className="w-10 h-10" />
              ) : (
                <Film className="w-10 h-10" />
              )}
              <span className="text-xs text-center px-2 line-clamp-2">
                {record.title}
              </span>
            </div>
          )}

          {/* Dark hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

          {/* Play button — appears on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Progress bar — always visible at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-red-500 transition-none"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Remove button — always visible on mobile, hover-only on desktop */}
      <button
        onClick={() => onRemove(record)}
        aria-label={`Remove ${record.title} from Continue Watching`}
        className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-black/90 md:opacity-0 md:group-hover:opacity-100 transition-all backdrop-blur-sm"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Info below poster */}
      <div className="mt-2 px-0.5 space-y-0.5">
        <p className="text-sm font-medium text-white line-clamp-1 leading-tight">
          {record.title}
        </p>
        {record.type === "tv" && record.season != null && record.episode != null && (
          <p className="text-xs text-zinc-500">
            S{String(record.season).padStart(2, "0")}E
            {String(record.episode).padStart(2, "0")}
          </p>
        )}
        <p className="text-xs text-zinc-500">
          {formatProgress(record.position_seconds, record.duration_seconds)}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ContinueWatchingSkeleton() {
  return (
    <section className="py-2">
      <div className="px-6 md:px-12 lg:px-20 mb-4 h-7 w-52 rounded bg-zinc-800 animate-pulse" />
      <div className="flex gap-3 px-6 md:px-12 lg:px-20 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-44 md:w-52 space-y-2">
            <div className="aspect-[2/3] w-full rounded-lg bg-zinc-800 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-zinc-800 animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ContinueWatchingRow() {
  const { user, token, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<WatchProgressRecord[] | null>(null); // null = not fetched yet
  const [fetching, setFetching] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const fetchProgress = useCallback(async (t: string) => {
    setFetching(true);
    try {
      const data = await getWatchProgressApi(t);
      setRecords(data);
    } catch {
      setRecords([]); // on error show nothing
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && token) {
      void fetchProgress(token);
    } else if (!authLoading && !token) {
      setRecords([]); // not logged in — nothing to show
    }
  }, [authLoading, token, fetchProgress]);

  const handleRemove = useCallback(
    async (record: WatchProgressRecord) => {
      if (!token) return;
      // Optimistic remove
      setRecords((prev) =>
        prev
          ? prev.filter(
              (r) =>
                !(
                  r.type === record.type &&
                  r.tmdb_id === record.tmdb_id &&
                  r.season === record.season &&
                  r.episode === record.episode
                )
            )
          : prev
      );
      try {
        await deleteWatchProgressApi(
          token,
          record.type,
          record.tmdb_id,
          record.season ?? undefined,
          record.episode ?? undefined
        );
      } catch {
        // On failure, re-fetch to restore actual state
        void fetchProgress(token);
      }
    },
    [token, fetchProgress]
  );

  const scroll = useCallback((direction: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: direction === "left" ? -rowRef.current.clientWidth * 0.75 : rowRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Show skeleton while auth is loading or fetch is in progress
  if (authLoading || fetching) return <ContinueWatchingSkeleton />;

  // Nothing to show
  if (!records || records.length === 0) return null;

  return (
    <section className="relative group/row py-2">
      <h2 className="text-base md:text-xl font-semibold text-white mb-3 md:mb-4 px-4 md:px-12 lg:px-20">
        Continue Watching
      </h2>

      <div className="relative">
        {/* Left arrow */}
        {showLeft && (
          <button
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 md:w-16 flex items-center justify-center bg-gradient-to-r from-black/90 to-transparent text-white md:opacity-0 md:group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-2 md:gap-3 overflow-x-auto px-4 md:px-12 lg:px-20 pb-3 md:pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {records.map((record) => (
            <ContinueCard
              key={`${record.type}-${record.tmdb_id}-${record.season ?? 0}-${record.episode ?? 0}`}
              record={record}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Right arrow */}
        {showRight && records.length > 3 && (
          <button
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 md:w-16 flex items-center justify-center bg-gradient-to-l from-black/90 to-transparent text-white md:opacity-0 md:group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}
      </div>
    </section>
  );
}
