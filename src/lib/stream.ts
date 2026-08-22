import type { StreamResponse } from "@/types/stream";
import { API_BASE, apiFetch } from "@/lib/api";

export async function getMovieStream(
  tmdbId: string | number,
  lang?: string
): Promise<StreamResponse> {
  const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  const res = await apiFetch(`${API_BASE}/stream/movie/${tmdbId}${qs}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);
  return res.json() as Promise<StreamResponse>;
}

export async function getTvStream(
  tmdbId: string | number,
  season: string | number,
  episode: string | number,
  lang?: string
): Promise<StreamResponse> {
  const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  const res = await apiFetch(
    `${API_BASE}/stream/tv/${tmdbId}/${season}/${episode}${qs}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);
  return res.json() as Promise<StreamResponse>;
}
