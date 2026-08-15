"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  saveWatchProgressApi,
  incrementWatchCountApi,
} from "@/lib/watch-api";

const MIN_POSITION_TO_SAVE = 10;
const SAVE_INTERVAL_SECONDS = 30;
const FINISHED_THRESHOLD = 0.95;

export interface WatchTrackingMeta {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  posterPath?: string | null;
  voteAverage?: number | string | null;
  releaseDate?: string | null;
  season?: number;
  episode?: number;
}

export interface WatchTrackingHandlers {
  onPlay: (currentTime: number, duration: number) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onPause: (currentTime: number, duration: number) => void;
  onEnded: (duration: number) => void;
}

export function useWatchTracking(meta: WatchTrackingMeta): WatchTrackingHandlers {
  const { token } = useAuth();

  const incrementedRef = useRef(false);
  const lastSavedAtRef = useRef(0);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const tokenRef = useRef(token);
  const metaRef = useRef(meta);

  // Always keep refs current — no re-renders triggered
  tokenRef.current = token;
  metaRef.current = meta;

  // Reset when the title/episode changes
  useEffect(() => {
    incrementedRef.current = false;
    lastSavedAtRef.current = 0;
    positionRef.current = 0;
    durationRef.current = 0;
  }, [meta.tmdbId, meta.season, meta.episode]);

  // Stable save function — reads from refs, never stale
  const saveProgress = useCallback(async (position: number, duration: number) => {
    const t = tokenRef.current;
    const m = metaRef.current;
    if (!t || position < MIN_POSITION_TO_SAVE || duration <= 0) return;
    if (position / duration >= FINISHED_THRESHOLD) return;
    try {
      await saveWatchProgressApi(t, {
        type: m.type,
        tmdb_id: m.tmdbId,
        title: m.title,
        poster_path: m.posterPath ?? null,
        ...(m.season != null ? { season: m.season } : {}),
        ...(m.episode != null ? { episode: m.episode } : {}),
        position_seconds: Math.floor(position),
        duration_seconds: Math.floor(duration),
      });
    } catch {
      // best-effort
    }
  }, []); // stable — reads only via refs

  // Keep a ref to saveProgress so the unmount cleanup is never stale
  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;

  const maybeIncrement = useCallback(() => {
    if (incrementedRef.current) return;
    incrementedRef.current = true;
    const m = metaRef.current;
    void incrementWatchCountApi({
      type: m.type,
      tmdb_id: m.tmdbId,
      title: m.title,
      poster_path: m.posterPath ?? null,
      vote_average: m.voteAverage ?? null,
      release_date: m.releaseDate ?? null,
    });
  }, []); // stable

  // Cleanup: save progress on unmount via ref — no stale closure
  useEffect(() => {
    return () => {
      const pos = positionRef.current;
      const dur = durationRef.current;
      if (pos > MIN_POSITION_TO_SAVE && dur > 0) {
        void saveProgressRef.current(pos, dur);
      }
    };
  }, []); // intentionally empty — cleanup uses refs only

  const onPlay = useCallback(
    (currentTime: number, duration: number) => {
      positionRef.current = currentTime;
      durationRef.current = duration;
      maybeIncrement();
    },
    [maybeIncrement]
  );

  const onTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      positionRef.current = currentTime;
      durationRef.current = duration;
      const now = Date.now() / 1000;
      if (now - lastSavedAtRef.current >= SAVE_INTERVAL_SECONDS) {
        lastSavedAtRef.current = now;
        void saveProgress(currentTime, duration);
      }
    },
    [saveProgress]
  );

  const onPause = useCallback(
    (currentTime: number, duration: number) => {
      positionRef.current = currentTime;
      durationRef.current = duration;
      void saveProgress(currentTime, duration);
    },
    [saveProgress]
  );

  const onEnded = useCallback((_duration: number) => {
    // Intentionally don't save — title is finished
  }, []);

  return { onPlay, onTimeUpdate, onPause, onEnded };
}
