"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft, Star, Clock, ChevronDown, Tv,
  SkipForward, SkipBack, RefreshCw,
} from "lucide-react";
import VidstackPlayer from "@/components/player/vidstack-player";
import DetailMediaRow from "@/components/detail/detail-media-row";
import StreamDisclaimer from "@/components/player/stream-disclaimer";
import ReportVideoButton from "@/components/player/report-video-button";
import type { MediaItem } from "@/types/api";
import type { Genre } from "@/types/detail";

const AUTOPLAY_KEY = "fw-autoplay-next";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SlimEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_url: string | null;
  runtime: number | null;
  air_date: string;
  vote_average: number;
}

interface SlimSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  episodes: SlimEpisode[];
}

interface ShowData {
  title: string;
  overview: string | null;
  poster_url: string | null;
  voteAverage: number;
  releaseDate: string;
  genres: Genre[];
  similar: MediaItem[];
  seasons: SlimSeason[];
}

interface TvWatchClientProps {
  id: string;
  show: ShowData;
  initialSeason: number;
  initialEpisode: number;
  streamToken: string;
}

// ─── Player area ──────────────────────────────────────────────────────────────

interface TvPlayerAreaProps {
  id: string;
  show: ShowData;
  currentSeason: number;
  currentEpisode: number;
  onSelectEpisode: (season: number, episode: number) => void;
  autoPlayNext: boolean;
  toggleAutoPlay: () => void;
  countdown: number | null;
  countdownRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  setCountdown: (v: number | null) => void;
  nextEpisodeCoords: { season: number; episode: number } | null;
  prevEpisodeCoords: { season: number; episode: number } | null;
  handleEpisodeEnded: () => void;
  streamToken: string;
}

function TvPlayerArea({
  id,
  show,
  currentSeason,
  currentEpisode,
  onSelectEpisode,
  autoPlayNext,
  toggleAutoPlay,
  countdown,
  countdownRef,
  setCountdown,
  nextEpisodeCoords,
  prevEpisodeCoords,
  handleEpisodeEnded,
  streamToken,
}: TvPlayerAreaProps) {
  const tmdbIdNum = parseInt(id, 10);

  const season = show.seasons.find((s) => s.season_number === currentSeason) ?? show.seasons[0];
  const episode = season?.episodes.find((e) => e.episode_number === currentEpisode) ?? season?.episodes[0];

  const trackingProps = useMemo(
    () => ({
      type: "tv" as const,
      tmdbId: tmdbIdNum,
      posterPath: show.poster_url,
      voteAverage: show.voteAverage,
      releaseDate: show.releaseDate,
      season: currentSeason,
      episode: currentEpisode,
    }),
    [tmdbIdNum, show.poster_url, show.voteAverage, show.releaseDate, currentSeason, currentEpisode],
  );

  const streamApiUrl = `/api/stream/tv/${id}/${currentSeason}/${currentEpisode}`;

  const nextEp = nextEpisodeCoords
    ? show.seasons.find((s) => s.season_number === nextEpisodeCoords.season)
        ?.episodes.find((e) => e.episode_number === nextEpisodeCoords.episode)
    : null;
  const prevEp = prevEpisodeCoords
    ? show.seasons.find((s) => s.season_number === prevEpisodeCoords.season)
        ?.episodes.find((e) => e.episode_number === prevEpisodeCoords.episode)
    : null;

  const [seasonPickerOpen, setSeasonPickerOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

      {/* ── Left: Player + controls + info ────────────────────────────── */}
      <div className="space-y-4">

        {/* Player */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-2xl shadow-black/60">
          <VidstackPlayer
            key={`${currentSeason}-${currentEpisode}`}
            streamApiUrl={streamApiUrl}
            title={`${show.title} — S${String(currentSeason).padStart(2, "0")}E${String(currentEpisode).padStart(2, "0")}: ${episode?.name ?? ""}`}
            posterUrl={episode?.still_url ?? show.poster_url}
            tracking={trackingProps}
            onEnded={handleEpisodeEnded}
            streamToken={streamToken}
          />

          {/* Auto-play countdown overlay */}
          {countdown !== null && nextEp && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 rounded-xl z-10">
              <p className="text-white text-sm font-medium">Up next in {countdown}s</p>
              <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex items-center gap-4 max-w-xs w-full mx-4">
                {nextEp.still_url && (
                  <div className="relative w-24 flex-shrink-0 aspect-video rounded-md overflow-hidden bg-zinc-800">
                    <Image src={nextEp.still_url} alt={nextEp.name} fill sizes="96px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">
                    S{String(nextEpisodeCoords!.season).padStart(2, "0")}E{String(nextEpisodeCoords!.episode).padStart(2, "0")}
                  </p>
                  <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{nextEp.name}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onSelectEpisode(nextEpisodeCoords!.season, nextEpisodeCoords!.episode)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Play Now
                </button>
                <button
                  onClick={() => {
                    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
                    setCountdown(null);
                  }}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-colors border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Episode navigation controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevEpisodeCoords && onSelectEpisode(prevEpisodeCoords.season, prevEpisodeCoords.episode)}
              disabled={!prevEpisodeCoords}
              title={prevEp ? `S${String(prevEpisodeCoords!.season).padStart(2, "0")}E${String(prevEpisodeCoords!.episode).padStart(2, "0")}: ${prevEp.name}` : "No previous episode"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm font-medium transition-colors hover:bg-zinc-800 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipBack className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={() => nextEpisodeCoords && onSelectEpisode(nextEpisodeCoords.season, nextEpisodeCoords.episode)}
              disabled={!nextEpisodeCoords}
              title={nextEp ? `S${String(nextEpisodeCoords!.season).padStart(2, "0")}E${String(nextEpisodeCoords!.episode).padStart(2, "0")}: ${nextEp.name}` : "No next episode"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm font-medium transition-colors hover:bg-zinc-800 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoPlay}
              title={autoPlayNext ? "Auto-play next: On" : "Auto-play next: Off"}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                autoPlayNext
                  ? "bg-red-600/15 border-red-500/40 text-red-400 hover:bg-red-600/25"
                  : "bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoPlayNext ? "text-red-400" : ""}`} />
              <span className="hidden sm:inline">Auto-play next</span>
              <span className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border border-white/10 transition-colors ${autoPlayNext ? "bg-red-600" : "bg-zinc-700"}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${autoPlayNext ? "translate-x-3" : "translate-x-0.5"}`} />
              </span>
            </button>
          </div>
        </div>

        <StreamDisclaimer />

        {/* Episode info */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{show.title}</p>
          <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">
            <span className="text-zinc-500 mr-2">
              S{String(currentSeason).padStart(2, "0")}E{String(currentEpisode).padStart(2, "0")}
            </span>
            {episode?.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-zinc-400">
            {episode?.air_date && <span>{episode.air_date.slice(0, 4)}</span>}
            {episode?.runtime && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{episode.runtime}m</span>
            )}
            {episode?.vote_average != null && episode.vote_average > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {episode.vote_average.toFixed(1)}
              </span>
            )}
            {show.genres.slice(0, 3).map((g) => (
              <span key={g.id} className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-xs">{g.name}</span>
            ))}
          </div>
          {episode?.overview && <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-3xl">{episode.overview}</p>}
          <div className="mt-3">
            <ReportVideoButton
              type="tv"
              tmdbId={tmdbIdNum}
              title={`${show.title} S${String(currentSeason).padStart(2, "0")}E${String(currentEpisode).padStart(2, "0")}${episode?.name ? ` - ${episode.name}` : ""}`}
            />
          </div>
        </div>
      </div>

      {/* ── Right: Episode selector ────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Season dropdown */}
        <div className="relative">
          <button
            onClick={() => setSeasonPickerOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 transition-colors text-sm text-white"
          >
            <span className="font-medium">{season?.name ?? `Season ${currentSeason}`}</span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${seasonPickerOpen ? "rotate-180" : ""}`} />
          </button>
          {seasonPickerOpen && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden shadow-xl shadow-black/50 max-h-56 overflow-y-auto">
              {show.seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectEpisode(s.season_number, s.episodes[0]?.episode_number ?? 1);
                    setSeasonPickerOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    s.season_number === currentSeason ? "bg-red-600 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {s.name}
                  <span className="ml-2 text-xs opacity-60">{s.episode_count} ep{s.episode_count !== 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Episode list */}
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="max-h-[calc(100vh-22rem)] overflow-y-auto divide-y divide-white/5" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
            {season?.episodes.map((ep) => {
              const isActive = ep.episode_number === currentEpisode;
              return (
                <button
                  key={ep.id}
                  onClick={() => onSelectEpisode(currentSeason, ep.episode_number)}
                  className={`w-full flex gap-3 p-3 text-left transition-colors ${isActive ? "bg-red-600/15 border-l-2 border-red-500" : "hover:bg-white/5 border-l-2 border-transparent"}`}
                >
                  <div className="relative w-24 flex-shrink-0 aspect-video rounded-md overflow-hidden bg-zinc-800">
                    {ep.still_url ? (
                      <Image src={ep.still_url} alt={ep.name} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <Tv className="w-4 h-4" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${isActive ? "text-red-400" : "text-zinc-500"}`}>E{ep.episode_number}</p>
                    <p className={`text-sm font-medium line-clamp-1 leading-tight mt-0.5 ${isActive ? "text-white" : "text-zinc-300"}`}>{ep.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                      {ep.runtime && <span>{ep.runtime}m</span>}
                      {ep.vote_average > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          {ep.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main TvWatchClient ───────────────────────────────────────────────────────

export default function TvWatchClient({
  id,
  show,
  initialSeason,
  initialEpisode,
  streamToken,
}: TvWatchClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);

  const [autoPlayNext, setAutoPlayNext] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem(AUTOPLAY_KEY);
    if (stored !== null) setAutoPlayNext(stored === "1");
  }, []);

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const season = show.seasons.find((s) => s.season_number === currentSeason) ?? show.seasons[0];

  const selectEpisode = useCallback(
    (seasonNum: number, episodeNum: number) => {
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      setCountdown(null);
      setCurrentSeason(seasonNum);
      setCurrentEpisode(episodeNum);
      const qs = new URLSearchParams();
      qs.set("season", String(seasonNum));
      qs.set("episode", String(episodeNum));
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    },
    [router, pathname],
  );

  const nextEpisodeCoords = useMemo((): { season: number; episode: number } | null => {
    if (!season) return null;
    const eps = season.episodes;
    const idx = eps.findIndex((e) => e.episode_number === currentEpisode);
    if (idx !== -1 && idx < eps.length - 1) return { season: currentSeason, episode: eps[idx + 1].episode_number };
    const sIdx = show.seasons.findIndex((s) => s.season_number === currentSeason);
    if (sIdx !== -1 && sIdx < show.seasons.length - 1) {
      const next = show.seasons[sIdx + 1];
      if (next.episodes.length > 0) return { season: next.season_number, episode: next.episodes[0].episode_number };
    }
    return null;
  }, [season, currentSeason, currentEpisode, show.seasons]);

  const prevEpisodeCoords = useMemo((): { season: number; episode: number } | null => {
    if (!season) return null;
    const eps = season.episodes;
    const idx = eps.findIndex((e) => e.episode_number === currentEpisode);
    if (idx > 0) return { season: currentSeason, episode: eps[idx - 1].episode_number };
    const sIdx = show.seasons.findIndex((s) => s.season_number === currentSeason);
    if (sIdx > 0) {
      const prev = show.seasons[sIdx - 1];
      if (prev.episodes.length > 0) {
        const last = prev.episodes[prev.episodes.length - 1];
        return { season: prev.season_number, episode: last.episode_number };
      }
    }
    return null;
  }, [season, currentSeason, currentEpisode, show.seasons]);

  const handleEpisodeEnded = useCallback(() => {
    if (!autoPlayNext || !nextEpisodeCoords) return;
    let secs = 5;
    setCountdown(secs);
    countdownRef.current = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        selectEpisode(nextEpisodeCoords.season, nextEpisodeCoords.episode);
      } else {
        setCountdown(secs);
      }
    }, 1000);
  }, [autoPlayNext, nextEpisodeCoords, selectEpisode]);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlayNext((prev) => {
      const next = !prev;
      localStorage.setItem(AUTOPLAY_KEY, next ? "1" : "0");
      if (!next && countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; setCountdown(null); }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-6">

        <Link
          href={`/tv/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {show.title}
        </Link>

        <TvPlayerArea
          id={id}
          show={show}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onSelectEpisode={selectEpisode}
          autoPlayNext={autoPlayNext}
          toggleAutoPlay={toggleAutoPlay}
          countdown={countdown}
          countdownRef={countdownRef}
          setCountdown={setCountdown}
          nextEpisodeCoords={nextEpisodeCoords}
          prevEpisodeCoords={prevEpisodeCoords}
          handleEpisodeEnded={handleEpisodeEnded}
          streamToken={streamToken}
        />

        {show.similar.length > 0 && (
          <div className="mt-10 border-t border-white/5 pt-8">
            <DetailMediaRow title="More Like This" items={show.similar} />
          </div>
        )}
      </div>
    </div>
  );
}
