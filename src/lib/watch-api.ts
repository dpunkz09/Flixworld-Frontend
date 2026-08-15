import { API_BASE } from "@/lib/api";
import { clientApiHeaders } from "@/lib/client-fetch";
import type { BecauseYouWatchedRow } from "@/types/api";

// Watch Progress types

export interface WatchProgressRecord {
  id: number;
  user_id: number;
  type: "movie" | "tv";
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  season: number | null;
  episode: number | null;
  position_seconds: number;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface SaveProgressPayload {
  type: "movie" | "tv";
  tmdb_id: number;
  title?: string;
  poster_path?: string | null;
  season?: number;
  episode?: number;
  position_seconds: number;
  duration_seconds: number;
}

export interface IncrementWatchPayload {
  type: "movie" | "tv";
  tmdb_id: number;
  title?: string;
  poster_path?: string | null;
  vote_average?: number | string | null;
  release_date?: string | null;
}

// Watch Progress API

export async function getWatchProgressApi(token: string): Promise<WatchProgressRecord[]> {
  const res = await fetch(`${API_BASE}/watch-progress`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch watch progress: ${res.status}`);
  return res.json() as Promise<WatchProgressRecord[]>;
}

export async function getTitleProgressApi(
  token: string,
  type: "movie" | "tv",
  tmdbId: number
): Promise<WatchProgressRecord | null> {
  const res = await fetch(`${API_BASE}/watch-progress/${type}/${tmdbId}`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data as WatchProgressRecord | null) ?? null;
}

export async function saveWatchProgressApi(
  token: string,
  payload: SaveProgressPayload
): Promise<WatchProgressRecord> {
  const res = await fetch(`${API_BASE}/watch-progress`, {
    method: "POST",
    headers: clientApiHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to save watch progress: ${res.status}`);
  return res.json() as Promise<WatchProgressRecord>;
}

export async function deleteWatchProgressApi(
  token: string,
  type: "movie" | "tv",
  tmdbId: number,
  season?: number,
  episode?: number
): Promise<void> {
  const params = new URLSearchParams();
  if (season != null) params.set("season", String(season));
  if (episode != null) params.set("episode", String(episode));
  const query = params.toString() ? `?${params.toString()}` : "";
  await fetch(`${API_BASE}/watch-progress/${type}/${tmdbId}${query}`, {
    method: "DELETE",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
}

// Most Watched Increment

export async function incrementWatchCountApi(payload: IncrementWatchPayload): Promise<void> {
  await fetch(`${API_BASE}/most-watched/increment`, {
    method: "POST",
    headers: clientApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

// Because You Watched

export async function getBecauseYouWatchedApi(
  token: string
): Promise<BecauseYouWatchedRow[]> {
  const res = await fetch(`${API_BASE}/recommendations/because-you-watched`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch recommendations: ${res.status}`);
  return res.json() as Promise<BecauseYouWatchedRow[]>;
}
