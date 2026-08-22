// NO "use client" directive here intentionally.
// This file is only ever imported via React.lazy (see vidstack-player.tsx).
// Adding "use client" causes Next.js 16 Turbopack to evaluate it server-side
// for the RSC module manifest, which triggers the vidstack proxy crash.

import { useRef, useEffect, useCallback } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  useMediaStore,
  useMediaPlayer,
  useMediaRemote,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import type { StreamResponse } from "@/types/stream";
import { useWatchTracking } from "@/hooks/useWatchTracking";
import type { WatchTrackingMeta } from "@/hooks/useWatchTracking";

export interface PlayerControls {
  play:  () => void;
  pause: () => void;
  seek:  (seconds: number) => void;
}

export interface PlayerInnerProps {
  streamData: StreamResponse;
  title: string;
  posterUrl?: string | null;
  resumePosition?: number;
  onEnded?: () => void;
  tracking?: WatchTrackingMeta;
  onPartyPlay?: (currentTime: number) => void;
  onPartyPause?: (currentTime: number) => void;
  onPartySeek?: (currentTime: number) => void;
  registerPlayerControls?: (controls: PlayerControls) => void;
  /** Override the active stream URL (used for server switching). When provided
   *  this takes precedence over streamData.data.stream_urls[0]. */
  srcOverride?: string | null;
  /** MIME type hint for srcOverride — defaults to HLS */
  srcOverrideType?: "application/x-mpegurl" | "video/mp4";
}

const HLS_PROXY = "https://proxy.jpaworx.com/?url=";
const THUMB_PROXY = "/api/thumbnails-proxy?url=";

function proxyHls(url: string) { return `${HLS_PROXY}${encodeURIComponent(url)}`; }
function proxyThumbnails(url: string) { return `${THUMB_PROXY}${encodeURIComponent(url)}`; }

// ─── TrackingLayer ────────────────────────────────────────────────────────────
// Must live inside <MediaPlayer> to use Vidstack context hooks.
// Handles: watch-progress tracking, resume seek, auto-play next, party sync.

function TrackingLayer({
  tracking,
  resumePosition,
  onEnded: onEndedProp,
  onPartyPlay,
  onPartyPause,
  onPartySeek,
  registerPlayerControls,
}: {
  tracking: WatchTrackingMeta;
  resumePosition: number;
  onEnded?: () => void;
  onPartyPlay?: (currentTime: number) => void;
  onPartyPause?: (currentTime: number) => void;
  onPartySeek?: (currentTime: number) => void;
  registerPlayerControls?: (controls: PlayerControls) => void;
}) {
  const { paused, ended, currentTime, duration, canPlay, seeking } = useMediaStore();
  const player = useMediaPlayer();
  // useMediaRemote dispatches through the media context — safe across StrictMode.
  // Never touches $state proxy directly, so no "$state[prop] is not a function".
  const remote = useMediaRemote();
  const { onPlay, onTimeUpdate, onPause, onEnded } = useWatchTracking(tracking);

  // ── Always-current refs ──────────────────────────────────────────────────────
  const onPlayRef = useRef(onPlay);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPauseRef = useRef(onPause);
  const onEndedRef = useRef(onEnded);
  const onPartyPlayRef = useRef(onPartyPlay);
  const onPartyPauseRef = useRef(onPartyPause);
  const onPartySeekRef = useRef(onPartySeek);
  onPlayRef.current = onPlay;
  onTimeUpdateRef.current = onTimeUpdate;
  onPauseRef.current = onPause;
  onEndedRef.current = onEnded;
  onPartyPlayRef.current = onPartyPlay;
  onPartyPauseRef.current = onPartyPause;
  onPartySeekRef.current = onPartySeek;

  // ── State tracking refs ──────────────────────────────────────────────────────
  const wasPlayingRef = useRef(false);
  const wasPausedRef = useRef(false);
  const wasEndedRef = useRef(false);
  const incrementFiredRef = useRef(false);
  const resumeSeekDoneRef = useRef(false);
  const lastSeekTimeRef = useRef<number>(-1);
  const seekingWasActiveRef = useRef(false);

  // Mounted guard — StrictMode double-invoke cleanup can destroy the player
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Player is ready when canPlay is true and the player instance exists
  const isReady = canPlay && player != null;

  // ── Register imperative controls for party remote sync ───────────────────────
  // Only register after canPlay so the player is fully initialised.
  useEffect(() => {
    if (!registerPlayerControls || !isReady) return;
    registerPlayerControls({
      play:  () => { if (mountedRef.current) try { remote.play();       } catch { /* ignore */ } },
      pause: () => { if (mountedRef.current) try { remote.pause();      } catch { /* ignore */ } },
      seek:  (t) => { if (mountedRef.current) try { remote.seek(t);     } catch { /* ignore */ } },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, registerPlayerControls]);

  // ── Resume seek (once) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current || !isReady || resumeSeekDoneRef.current || resumePosition <= 0) return;
    resumeSeekDoneRef.current = true;
    try { remote.seek(resumePosition); } catch { /* ignore */ }
  }, [isReady, resumePosition, remote]);

  // ── Play / increment ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current || !isReady) return;
    if (!paused && !ended) {
      if (!incrementFiredRef.current) {
        incrementFiredRef.current = true;
        onPlayRef.current(currentTime, duration);
      }
      if (!wasPlayingRef.current) {
        onPartyPlayRef.current?.(currentTime);
      }
      wasPlayingRef.current = true;
      wasPausedRef.current = false;
    }
  }, [isReady, paused, ended, currentTime, duration]);

  // ── Periodic time-update ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current || !isReady || paused || ended) return;
    onTimeUpdateRef.current(currentTime, duration);
  }, [isReady, paused, ended, currentTime, duration]);

  // ── Pause ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current || !isReady) return;
    if (paused && wasPlayingRef.current && !wasPausedRef.current) {
      wasPausedRef.current = true;
      wasPlayingRef.current = false;
      onPauseRef.current(currentTime, duration);
      onPartyPauseRef.current?.(currentTime);
    }
  }, [isReady, paused, currentTime, duration]);

  // ── Seeked (host broadcasts new position after seeking) ──────────────────────
  // Detect transition: seeking=true → seeking=false (seek complete)
  useEffect(() => {
    if (!mountedRef.current || !isReady) return;
    if (seeking) {
      seekingWasActiveRef.current = true;
    } else if (seekingWasActiveRef.current) {
      seekingWasActiveRef.current = false;
      // Ignore the initial resume-seek and duplicate same-position seeks
      if (Math.abs(currentTime - lastSeekTimeRef.current) > 0.5) {
        lastSeekTimeRef.current = currentTime;
        onPartySeekRef.current?.(currentTime);
      }
    }
  }, [isReady, seeking, currentTime]);

  // ── Ended ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current) return;
    if (ended && !wasEndedRef.current) {
      wasEndedRef.current = true;
      onEndedRef.current(duration);
      onEndedProp?.();
    }
  }, [ended, duration, onEndedProp]);

  return null;
}

// ─── PlayerInner (default export) ────────────────────────────────────────────

export default function PlayerInner({
  streamData,
  title,
  posterUrl,
  resumePosition = 0,
  onEnded: onEndedProp,
  tracking,
  onPartyPlay,
  onPartyPause,
  onPartySeek,
  registerPlayerControls,
  srcOverride,
  srcOverrideType,
}: PlayerInnerProps) {
  const activeUrl  = srcOverride ?? streamData.data.stream_urls[0];
  const activeType = srcOverride
    ? (srcOverrideType ?? "video/mp4")
    : "application/x-mpegurl";

  // Only proxy through HLS proxy when it's an HLS stream
  const src = activeType === "application/x-mpegurl"
    ? proxyHls(activeUrl)
    : activeUrl;

  const onHlsInstance = useCallback((event: CustomEvent) => {
    const hls = event.detail as {
      config?: {
        maxBufferLength?: number;
        maxMaxBufferLength?: number;
        maxBufferHole?: number;
        lowLatencyMode?: boolean;
        backBufferLength?: number;
      };
    };
    if (hls?.config) {
      hls.config.maxBufferLength    = 60;
      hls.config.maxMaxBufferLength = 120;
      hls.config.maxBufferHole      = 0.5;
      hls.config.lowLatencyMode     = false;
      hls.config.backBufferLength   = 30;
    }
  }, []);

  const thumbnails = streamData.thumbnails_url
    ? proxyThumbnails(streamData.thumbnails_url)
    : undefined;

  const allSubs = [
    ...(streamData.default_subs ?? []),
    ...(streamData.subtitles ?? []),
  ].filter((s) => Boolean(s.file));

  const seenLabels = new Set<string>();
  const uniqueSubs = allSubs.filter((s) => {
    if (seenLabels.has(s.label)) return false;
    seenLabels.add(s.label);
    return true;
  });

  return (
    <MediaPlayer
      title={title}
      src={{ src, type: activeType }}
      playsInline
      autoPlay
      muted
      className="w-full aspect-video rounded-xl overflow-hidden bg-black"
      onHlsInstance={(event: CustomEvent) => onHlsInstance(event)}
    >
      <MediaProvider>
        {posterUrl && (
          <Poster
            src={posterUrl}
            alt={title}
            className="absolute inset-0 block w-full h-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
          />
        )}
        {uniqueSubs.map((s) => (
          <Track
            key={`sub-${s.label}`}
            kind="subtitles"
            src={s.file}
            label={s.label}
            default={s.label === "English"}
          />
        ))}
      </MediaProvider>

      <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={thumbnails} />

      {tracking && (
        <TrackingLayer
          tracking={tracking}
          resumePosition={resumePosition}
          onEnded={onEndedProp}
          onPartyPlay={onPartyPlay}
          onPartyPause={onPartyPause}
          onPartySeek={onPartySeek}
          registerPlayerControls={registerPlayerControls}
        />
      )}
    </MediaPlayer>
  );
}
