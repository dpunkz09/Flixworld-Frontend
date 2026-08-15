import type { HomepageData, MostWatchedItem } from "@/types/api";
import type { MovieDetail, TvDetail } from "@/types/detail";
import type {
  SearchResult,
  DiscoverResult,
  PersonDetails,
  PersonCredits,
  CompanyDetails,
  NetworkDetails,
} from "@/lib/tmdb";
import {
  CACHE_HOMEPAGE_TTL,
  CACHE_MOVIE_DETAIL_TTL,
  CACHE_TV_DETAIL_TTL,
  CACHE_MOST_WATCHED_TTL,
} from "@/lib/cache-config";
import type { SortOption } from "@/types/tmdb";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api-backend.jpaworx.com/api";export const STORAGE_BASE = `${API_BASE.replace(/\/api$/, "")}/storage`;

// ─── API key helper ───────────────────────────────────────────────────────────
// API_SECRET_KEY       — server-only (no NEXT_PUBLIC_), used in SSR/API routes
// NEXT_PUBLIC_API_CLIENT_KEY — safe for browser, used in client components

function apiKeyHeaders(): HeadersInit {
  // Server-side: prefer the secret key
  const serverKey = process.env.API_SECRET_KEY;
  if (serverKey) return { "X-API-Key": serverKey };
  // Client-side fallback: use the public client key
  const clientKey = process.env.NEXT_PUBLIC_API_CLIENT_KEY;
  if (clientKey) return { "X-API-Key": clientKey };
  return {};
}

/**
 * Drop-in replacement for fetch() that automatically injects X-API-Key.
 * Works in both server components (uses secret key) and client components
 * (uses the public client key).
 */
export async function apiFetch(
  url: string,
  init: RequestInit & { next?: NextFetchRequestConfig } = {}
): Promise<Response> {
  const { next, headers, ...rest } = init as RequestInit & {
    next?: NextFetchRequestConfig;
  };
  return fetch(url, {
    ...rest,
    headers: { ...apiKeyHeaders(), ...(headers as Record<string, string> | undefined) },
    ...(next ? { next } : {}),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function resolveStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Strip leading slash to avoid double-slash with STORAGE_BASE
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${STORAGE_BASE}/${cleanPath}`;
}

// ─── Homepage / Movie / TV / Most Watched ─────────────────────────────────────

export async function getHomepageData(): Promise<HomepageData> {
  const res = await apiFetch(API_BASE, { next: { revalidate: CACHE_HOMEPAGE_TTL } });
  if (!res.ok) throw new Error(`Failed to fetch homepage data: ${res.status}`);
  return res.json() as Promise<HomepageData>;
}

export async function getMovieDetail(id: number | string): Promise<MovieDetail> {
  const res = await apiFetch(`${API_BASE}/movie/${id}`, { next: { revalidate: CACHE_MOVIE_DETAIL_TTL } });
  if (!res.ok) throw new Error(`Failed to fetch movie ${id}: ${res.status}`);
  return res.json() as Promise<MovieDetail>;
}

export async function getTvDetail(id: number | string): Promise<TvDetail> {
  const res = await apiFetch(`${API_BASE}/tv/${id}`, { next: { revalidate: CACHE_TV_DETAIL_TTL } });
  if (!res.ok) throw new Error(`Failed to fetch TV show ${id}: ${res.status}`);
  return res.json() as Promise<TvDetail>;
}

export async function getMostWatched(): Promise<MostWatchedItem[]> {
  const res = await apiFetch(`${API_BASE}/most-watched`, { next: { revalidate: CACHE_MOST_WATCHED_TTL } });
  if (!res.ok) throw new Error(`Failed to fetch most watched: ${res.status}`);
  return res.json() as Promise<MostWatchedItem[]>;
}

// ─── Discover: Movies ─────────────────────────────────────────────────────────

export interface DiscoverMoviesParams {
  page?: number;
  sort_by?: SortOption;
  with_genres?: string;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
}

export async function discoverMovies(params: DiscoverMoviesParams = {}): Promise<DiscoverResult> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.with_genres) qs.set("with_genres", params.with_genres);
  if (params["vote_average.gte"] != null) qs.set("vote_average.gte", String(params["vote_average.gte"]));
  if (params["vote_average.lte"] != null) qs.set("vote_average.lte", String(params["vote_average.lte"]));
  if (params["primary_release_date.gte"]) qs.set("primary_release_date.gte", params["primary_release_date.gte"]);
  if (params["primary_release_date.lte"]) qs.set("primary_release_date.lte", params["primary_release_date.lte"]);

  const res = await apiFetch(`${API_BASE}/movies?${qs.toString()}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch movies: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

// ─── Discover: TV ─────────────────────────────────────────────────────────────

export interface DiscoverTvParams {
  page?: number;
  sort_by?: SortOption;
  with_genres?: string;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "first_air_date.gte"?: string;
  "first_air_date.lte"?: string;
}

export async function discoverTv(params: DiscoverTvParams = {}): Promise<DiscoverResult> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.with_genres) qs.set("with_genres", params.with_genres);
  if (params["vote_average.gte"] != null) qs.set("vote_average.gte", String(params["vote_average.gte"]));
  if (params["vote_average.lte"] != null) qs.set("vote_average.lte", String(params["vote_average.lte"]));
  if (params["first_air_date.gte"]) qs.set("first_air_date.gte", params["first_air_date.gte"]);
  if (params["first_air_date.lte"]) qs.set("first_air_date.lte", params["first_air_date.lte"]);

  const res = await apiFetch(`${API_BASE}/tvseries?${qs.toString()}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch TV series: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchMulti(query: string, page = 1): Promise<SearchResult> {
  if (!query.trim()) return { items: [], page: 1, total_pages: 0, total_results: 0 };
  const qs = new URLSearchParams({ q: query.trim(), page: String(page) });
  const res = await apiFetch(`${API_BASE}/search?${qs.toString()}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<SearchResult>;
}

// ─── Person ───────────────────────────────────────────────────────────────────

export async function getPersonDetails(personId: number | string): Promise<PersonDetails> {
  const res = await apiFetch(`${API_BASE}/person/${personId}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch person ${personId}: ${res.status}`);
  return res.json() as Promise<PersonDetails>;
}

export async function getPersonCredits(personId: number | string): Promise<PersonCredits> {
  const res = await apiFetch(`${API_BASE}/person/${personId}/credits`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch person credits ${personId}: ${res.status}`);
  return res.json() as Promise<PersonCredits>;
}

// ─── Keyword ──────────────────────────────────────────────────────────────────

export async function getKeywordName(keywordId: number | string): Promise<string> {
  const res = await apiFetch(`${API_BASE}/keyword/${keywordId}`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Failed to fetch keyword ${keywordId}: ${res.status}`);
  const data = await res.json() as { id: number; name: string };
  return data.name;
}

export async function getKeywordMovies(keywordId: number | string, page = 1): Promise<DiscoverResult> {
  const res = await apiFetch(`${API_BASE}/keyword/${keywordId}/movies?page=${page}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch keyword movies: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

export async function getKeywordTv(keywordId: number | string, page = 1): Promise<DiscoverResult> {
  const res = await apiFetch(`${API_BASE}/keyword/${keywordId}/tv?page=${page}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch keyword TV: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

// ─── Company ──────────────────────────────────────────────────────────────────

export async function getCompanyDetails(companyId: number | string): Promise<CompanyDetails> {
  const res = await apiFetch(`${API_BASE}/company/${companyId}`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Failed to fetch company ${companyId}: ${res.status}`);
  return res.json() as Promise<CompanyDetails>;
}

export async function getCompanyMovies(companyId: number | string, page = 1): Promise<DiscoverResult> {
  const res = await apiFetch(`${API_BASE}/company/${companyId}/movies?page=${page}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch company movies: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

export async function getCompanyTv(companyId: number | string, page = 1): Promise<DiscoverResult> {
  const res = await apiFetch(`${API_BASE}/company/${companyId}/tv?page=${page}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch company TV: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

// ─── Network ──────────────────────────────────────────────────────────────────

export async function getNetworkDetails(networkId: number | string): Promise<NetworkDetails> {
  const res = await apiFetch(`${API_BASE}/network/${networkId}`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Failed to fetch network ${networkId}: ${res.status}`);
  return res.json() as Promise<NetworkDetails>;
}

export async function getNetworkTv(networkId: number | string, page = 1): Promise<DiscoverResult> {
  const res = await apiFetch(`${API_BASE}/network/${networkId}/tv?page=${page}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch network TV: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

// ─── Country ──────────────────────────────────────────────────────────────────

export async function discoverMoviesByCountry(params: {
  countryCode: string; page?: number; sort_by?: string; with_genres?: string;
  "primary_release_date.gte"?: string; "primary_release_date.lte"?: string;
}): Promise<DiscoverResult> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.with_genres) qs.set("with_genres", params.with_genres);
  if (params["primary_release_date.gte"]) qs.set("primary_release_date.gte", params["primary_release_date.gte"]);
  if (params["primary_release_date.lte"]) qs.set("primary_release_date.lte", params["primary_release_date.lte"]);

  const res = await apiFetch(`${API_BASE}/country/${params.countryCode}/movies?${qs.toString()}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch country movies: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}

export async function discoverTvByCountry(params: {
  countryCode: string; page?: number; sort_by?: string; with_genres?: string;
  "first_air_date.gte"?: string; "first_air_date.lte"?: string;
}): Promise<DiscoverResult> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.with_genres) qs.set("with_genres", params.with_genres);
  if (params["first_air_date.gte"]) qs.set("first_air_date.gte", params["first_air_date.gte"]);
  if (params["first_air_date.lte"]) qs.set("first_air_date.lte", params["first_air_date.lte"]);

  const res = await apiFetch(`${API_BASE}/country/${params.countryCode}/tv?${qs.toString()}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch country TV: ${res.status}`);
  return res.json() as Promise<DiscoverResult>;
}
