"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getTitleProgressApi, type WatchProgressRecord } from "@/lib/watch-api";

/** Progress % below which we offer a resume button (above this = finished) */
const FINISHED_THRESHOLD = 0.95;
/** Minimum seconds watched before we offer a resume button */
const MIN_SECONDS = 10;

interface ResumeButtonProps {
  type: "movie" | "tv";
  tmdbId: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getResumeHref(record: WatchProgressRecord): string {
  if (record.type === "movie") return `/watch/movie/${record.tmdb_id}`;
  const s = record.season ?? 1;
  const e = record.episode ?? 1;
  return `/watch/tv/${record.tmdb_id}?season=${s}&episode=${e}`;
}

export default function ResumeButton({ type, tmdbId }: ResumeButtonProps) {
  const { token, loading: authLoading } = useAuth();
  const [record, setRecord] = useState<WatchProgressRecord | null>(null);

  useEffect(() => {
    if (authLoading || !token) return;
    void getTitleProgressApi(token, type, tmdbId).then((r) => {
      if (!r) return;
      const pct = r.duration_seconds > 0
        ? r.position_seconds / r.duration_seconds
        : 0;
      if (r.position_seconds >= MIN_SECONDS && pct < FINISHED_THRESHOLD) {
        setRecord(r);
      }
    });
  }, [authLoading, token, type, tmdbId]);

  if (!record) return null;

  const pct = Math.min(
    (record.position_seconds / record.duration_seconds) * 100,
    100
  );
  const label =
    record.type === "tv" && record.season != null && record.episode != null
      ? `Resume S${String(record.season).padStart(2, "0")}E${String(record.episode).padStart(2, "0")} · ${formatTime(record.position_seconds)}`
      : `Resume · ${formatTime(record.position_seconds)}`;

  return (
    <Link
      href={getResumeHref(record)}
      className="relative inline-flex items-center gap-2 overflow-hidden bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full px-6 py-3 text-sm transition-colors backdrop-blur-sm border border-white/20"
    >
      {/* Progress fill */}
      <span
        className="absolute inset-y-0 left-0 bg-red-600/30 transition-none pointer-events-none"
        style={{ width: `${pct}%` }}
      />
      <RotateCcw className="relative w-4 h-4" />
      <span className="relative">{label}</span>
    </Link>
  );
}
