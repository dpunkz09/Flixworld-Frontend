import type { StreamResponse } from "@/types/stream";
import { API_BASE, apiFetch } from "@/lib/api";

export async function getMovieStream(
  tmdbId: string | number
): Promise<StreamResponse> {
  const res = await apiFetch(`${API_BASE}/stream/movie/${tmdbId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);
  return res.json() as Promise<StreamResponse>;
}

export async function getTvStream(
  tmdbId: string | number,
  season: string | number,
  episode: string | number
): Promise<StreamResponse> {
  const res = await apiFetch(
    `${API_BASE}/stream/tv/${tmdbId}/${season}/${episode}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);
  return res.json() as Promise<StreamResponse>;
}
