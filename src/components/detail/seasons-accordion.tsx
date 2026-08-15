"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Tv, Star, Clock, Play, RotateCcw } from "lucide-react";
import type { Season } from "@/types/detail";
import { useAuth } from "@/hooks/useAuth";
import { getTitleProgressApi, type WatchProgressRecord } from "@/lib/watch-api";
const FINISHED_THRESHOLD = 0.95;
const MIN_SECONDS = 10;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface SeasonsAccordionProps {
  seasons: Season[];
  tmdbId: number;
}

export default function SeasonsAccordion({ seasons, tmdbId }: SeasonsAccordionProps) {
  const { token } = useAuth();
  const [progress, setProgress] = useState<WatchProgressRecord | null>(null);

  // Filter out specials unless the only season
  const filtered = seasons.filter((s) => s.season_number > 0 || seasons.length === 1);

  // Default open: season containing the in-progress episode, or the latest
  const [openId, setOpenId] = useState<number>(
    filtered[filtered.length - 1]?.id ?? -1
  );

  useEffect(() => {
    if (!token || !tmdbId) return;
    getTitleProgressApi(token, "tv", tmdbId)
      .then((rec) => {
        if (!rec) return;
        const pct = rec.duration_seconds > 0
          ? rec.position_seconds / rec.duration_seconds : 0;
        if (rec.position_seconds < MIN_SECONDS || pct >= FINISHED_THRESHOLD) return;
        setProgress(rec);
        // Open the season that contains the in-progress episode
        const inProgressSeason = filtered.find(
          (s) => s.season_number === rec.season
        );
        if (inProgressSeason) setOpenId(inProgressSeason.id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tmdbId]);

  if (!filtered.length) return null;

  return (
    <section className="px-4 md:px-12 lg:px-20 py-8 border-t border-white/5">
      <h2 className="text-xl font-semibold text-white mb-5">Seasons & Episodes</h2>

      <div className="space-y-2">
        {filtered.map((season) => {
          const isOpen = openId === season.id;

          return (
            <div
              key={season.id}
              className="rounded-xl border border-white/8 overflow-hidden bg-zinc-900/50"
            >
              {/* Season header */}
              <button
                onClick={() => setOpenId(isOpen ? -1 : season.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
                  {season.poster_url ? (
                    <Image
                      src={season.poster_url}
                      alt={season.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                      <Tv className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{season.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {season.episode_count} episode{season.episode_count !== 1 ? "s" : ""}
                    {season.air_date ? ` · ${season.air_date.slice(0, 4)}` : ""}
                  </p>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Episode list */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  {season.overview && (
                    <p className="px-4 pt-1 pb-3 text-xs text-zinc-400 border-t border-white/5 leading-relaxed">
                      {season.overview}
                    </p>
                  )}

                  <div className="divide-y divide-white/5">
                    {season.episodes.map((ep) => {
                      const isResume =
                        progress?.season === season.season_number &&
                        progress?.episode === ep.episode_number;
                      const pct = isResume && progress.duration_seconds > 0
                        ? Math.min((progress.position_seconds / progress.duration_seconds) * 100, 100)
                        : 0;
                      const watchHref = `/watch/tv/${tmdbId}?season=${season.season_number}&episode=${ep.episode_number}`;

                      return (
                        <Link
                          key={ep.id}
                          href={watchHref}
                          className={`flex gap-3 px-4 py-3 transition-colors group/ep ${
                            isResume
                              ? "bg-red-600/5 hover:bg-red-600/10"
                              : "hover:bg-white/3"
                          }`}
                        >
                          {/* Episode still with play overlay */}
                          <div className="relative w-28 md:w-36 flex-shrink-0 aspect-video rounded-md overflow-hidden bg-zinc-800">
                            {ep.still_url ? (
                              <Image
                                src={ep.still_url}
                                alt={ep.name}
                                fill
                                sizes="144px"
                                className="object-cover transition-transform duration-300 group-hover/ep:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                                <Tv className="w-5 h-5" />
                              </div>
                            )}

                            {/* Play overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover/ep:bg-black/40 transition-colors flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity">
                                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                              </div>
                            </div>

                            {/* Progress bar for resume episode */}
                            {isResume && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div
                                  className="h-full bg-red-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Episode info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-white leading-tight">
                                <span className="text-zinc-500 mr-1.5">
                                  E{ep.episode_number}
                                </span>
                                {ep.name}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0 text-xs text-zinc-400">
                                {ep.runtime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {ep.runtime}m
                                  </span>
                                )}
                                {ep.vote_average > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {ep.vote_average.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {ep.air_date && (
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                {new Date(ep.air_date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            )}

                            {/* Resume badge */}
                            {isResume && (
                              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-medium">
                                <RotateCcw className="w-2.5 h-2.5" />
                                Resume at {formatTime(progress.position_seconds)}
                              </div>
                            )}

                            {ep.overview && (
                              <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                {ep.overview}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
