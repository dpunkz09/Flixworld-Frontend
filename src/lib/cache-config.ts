/**
 * Central cache configuration — all durations are read from env vars.
 * Values are in SECONDS unless stated otherwise.
 *
 * Set these in .env.local (dev) or .env.production (server) to override defaults.
 */

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// ---------------------------------------------------------------------------
// Next.js server-side data cache (next: { revalidate })
// ---------------------------------------------------------------------------

/** Homepage sections — ISR revalidate interval in seconds */
export const CACHE_HOMEPAGE_TTL = envInt("CACHE_HOMEPAGE_TTL", 600); // 10 min

/** Movie detail pages — ISR revalidate interval in seconds */
export const CACHE_MOVIE_DETAIL_TTL = envInt("CACHE_MOVIE_DETAIL_TTL", 3600); // 1 h

/** TV show detail pages — ISR revalidate interval in seconds */
export const CACHE_TV_DETAIL_TTL = envInt("CACHE_TV_DETAIL_TTL", 3600); // 1 h

/** Most-watched list — ISR revalidate interval in seconds */
export const CACHE_MOST_WATCHED_TTL = envInt("CACHE_MOST_WATCHED_TTL", 600); // 10 min

// ---------------------------------------------------------------------------
// HTTP Cache-Control headers (sent to the browser / CDN)
// ---------------------------------------------------------------------------

/** Subtitle files (VTT/SRT) — browser cache max-age in seconds */
export const CACHE_SUBTITLE_MAX_AGE = envInt("CACHE_SUBTITLE_MAX_AGE", 86400); // 24 h

/** HLS video segments (.ts, .mp4) — browser cache max-age in seconds */
export const CACHE_HLS_SEGMENT_MAX_AGE = envInt("CACHE_HLS_SEGMENT_MAX_AGE", 3600); // 1 h
