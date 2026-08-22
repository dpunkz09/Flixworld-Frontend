import { API_BASE } from "@/lib/api";
import { clientApiHeaders } from "@/lib/client-fetch";

function adminHeaders(token: string): HeadersInit {
  return clientApiHeaders({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
}

async function adminFetch<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = init;
  const res = await fetch(`${API_BASE}/admin${path}`, {
    ...rest,
    headers: { ...adminHeaders(token), ...(headers as Record<string, string> | undefined) },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { const b = await res.json(); msg = b?.message ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// --- Types -----------------------------------------------------------------

export interface AdminUser {
  id: number; name: string; email: string; is_admin: boolean;
  profile_picture: string | null; created_at: string; updated_at?: string;
}

export interface AdminComment {
  id: number; body: string; type: string; tmdb_id: number; parent_id: number | null;
  user: { id: number; name: string; email: string }; created_at: string;
}

export interface VideoReport {
  id: number; type: string; tmdb_id: number; title: string | null;
  reason: string; notes: string | null; status: string; admin_note: string | null;
  user: { id: number; name: string; email: string }; created_at: string;
}

export interface FeaturedItem {
  id: number; type: string; tmdb_id: number; title: string | null;
  poster_path: string | null; backdrop_path: string | null;
  vote_average: number | null; release_date: string | null;
  overview: string | null; active: boolean; sort_order: number;
  created_at: string; updated_at: string;
}

export interface TmdbSearchResult {
  tmdb_id: number;
  type: "movie" | "tv";
  title: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  release_date: string | null;
  overview: string | null;
}

export interface CustomStreamUrl {
  id: number; type: string; tmdb_id: number; title: string | null;
  stream_urls: string[]; active: boolean; notes: string | null;
  created_at: string; updated_at: string;
}

export interface MostWatchedItem {
  id: number; type: string; tmdb_id: number; title: string | null;
  poster_path: string | null; vote_average: number | null;
  release_year: number | null; watch_count: number;
}

export interface SearchKeyword {
  id: number; query: string; count: number;
  last_results: number | null; last_searched_at: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; total: number; last_page: number };
}

export interface DashboardData {
  stats: {
    total_users: number; total_comments: number; total_most_watched: number;
    total_search_queries: number; pending_reports: number;
    total_watch_progress: number; total_wishlists: number;
  };
  recent_users: AdminUser[];
  top_searches: SearchKeyword[];
  top_watched: MostWatchedItem[];
}

export interface SiteSettings {
  "analytics.code": string;
  "adsense.code": string;
  "player.hls_proxy": string;
  "redis.enabled": boolean;
  "redis.host": string;
  "redis.port": number;
  "redis.password": string;
  "redis.db": number;
  "tmdb.api_key": string;
  // Android version gate
  "app.android.version_code": number;
  "app.android.version_name": string;
  "app.android.apk_url": string;
  // Download page
  "download.show_page": boolean;
  "download.headline": string;
  "download.subheadline": string;
  "download.badge_google_play": string;
  "download.badge_direct": string;
  "download.badge_apkpure": string;
  "download.badge_uptodown": string;
  "download.screenshots": string;  // JSON array of screenshot URLs
  "download.features": string;     // JSON array of {icon, title, body} objects
}

// --- Dashboard --------------------------------------------------------------

export const getDashboard = (token: string) =>
  adminFetch<DashboardData>(token, "/dashboard");

// --- Users ------------------------------------------------------------------

export const getAdminUsers = (token: string, page = 1, search?: string) =>
  adminFetch<Paginated<AdminUser>>(token, `/users?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`);

export const updateAdminUser = (token: string, id: number, data: { is_admin?: boolean; name?: string }) =>
  adminFetch<AdminUser>(token, `/users/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteAdminUser = (token: string, id: number) =>
  adminFetch<{ message: string }>(token, `/users/${id}`, { method: "DELETE" });

// --- Comments ---------------------------------------------------------------

export const getAdminComments = (token: string, page = 1, search?: string) =>
  adminFetch<Paginated<AdminComment>>(token, `/comments?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`);

export const deleteAdminComment = (token: string, id: number) =>
  adminFetch<{ message: string }>(token, `/comments/${id}`, { method: "DELETE" });

// --- Video Reports -----------------------------------------------------------

export const getAdminReports = (token: string, page = 1, status?: string) =>
  adminFetch<Paginated<VideoReport>>(token, `/reports?page=${page}${status ? `&status=${status}` : ""}`);

export const updateAdminReport = (token: string, id: number, data: { status: string; admin_note?: string }) =>
  adminFetch<VideoReport>(token, `/reports/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteAdminReport = (token: string, id: number) =>
  adminFetch<{ message: string }>(token, `/reports/${id}`, { method: "DELETE" });

// --- Featured Items ----------------------------------------------------------

export const getAdminFeatured = (token: string) =>
  adminFetch<FeaturedItem[]>(token, "/featured");

export const searchFeaturedCandidates = (
  token: string,
  q: string,
  type: "all" | "movie" | "tv" = "all",
) => adminFetch<TmdbSearchResult[]>(token, `/featured/search?q=${encodeURIComponent(q)}&type=${type}`);

export const addAdminFeatured = (token: string, data: Partial<FeaturedItem>) =>
  adminFetch<FeaturedItem>(token, "/featured", { method: "POST", body: JSON.stringify(data) });

export const updateAdminFeatured = (token: string, id: number, data: Partial<FeaturedItem>) =>
  adminFetch<FeaturedItem>(token, `/featured/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteAdminFeatured = (token: string, id: number) =>
  adminFetch<{ message: string }>(token, `/featured/${id}`, { method: "DELETE" });

export const reorderAdminFeatured = (token: string, order: { id: number; sort_order: number }[]) =>
  adminFetch<{ message: string }>(token, "/featured/reorder", { method: "PATCH", body: JSON.stringify(order) });

// --- Stream URLs -------------------------------------------------------------

export const getAdminStreamUrls = (token: string, page = 1) =>
  adminFetch<Paginated<CustomStreamUrl>>(token, `/stream-urls?page=${page}`);

export const upsertAdminStreamUrl = (token: string, data: { type: string; tmdb_id: number; title?: string; stream_urls: string[]; notes?: string }) =>
  adminFetch<CustomStreamUrl>(token, "/stream-urls", { method: "POST", body: JSON.stringify(data) });

export const deleteAdminStreamUrl = (token: string, id: number) =>
  adminFetch<{ message: string }>(token, `/stream-urls/${id}`, { method: "DELETE" });

// --- Cache -------------------------------------------------------------------

export const getAdminCacheStatus = (token: string) =>
  adminFetch<{ redis_enabled: boolean; redis_connected: boolean }>(token, "/cache/status");

export interface CachePatternStat {
  pattern: string;
  key_count: number;
  size_bytes: number;
}

export interface CacheStats {
  total_keys: number;
  used_memory_bytes: number;
  used_memory_human: string;
  peak_memory_bytes: number;
  peak_memory_human: string;
  patterns: CachePatternStat[];
}

export const getAdminCacheStats = (token: string) =>
  adminFetch<CacheStats>(token, "/cache/stats");

export const clearAdminCache = (token: string, pattern = "*") =>
  adminFetch<{ message: string }>(token, `/cache?pattern=${encodeURIComponent(pattern)}`, { method: "DELETE" });

export const clearAdminChatHistory = (token: string) =>
  adminFetch<{ message: string }>(token, "/cache/chat/clear", { method: "POST" });

export const refreshTmdbData = (token: string, type: string, tmdbId: number) =>
  adminFetch<{ message: string }>(token, `/cache/refresh/${type}/${tmdbId}`, { method: "POST" });

// --- Most Watched -------------------------------------------------------------

export const getAdminMostWatched = (token: string, page = 1) =>
  adminFetch<Paginated<MostWatchedItem>>(token, `/most-watched?page=${page}`);

export const deleteAdminMostWatched = (token: string, id: number) =>
  adminFetch<{ message: string }>(token, `/most-watched/${id}`, { method: "DELETE" });

// --- Search Keywords ----------------------------------------------------------

export const getAdminSearchKeywords = (token: string, page = 1) =>
  adminFetch<Paginated<SearchKeyword>>(token, `/search-keywords?page=${page}`);

export const deleteAdminSearchKeyword = (token: string, id: number) =>
  adminFetch<{ message: string }>(token, `/search-keywords/${id}`, { method: "DELETE" });

// --- Site Settings ------------------------------------------------------------

export const getAdminSettings = (token: string) =>
  adminFetch<SiteSettings>(token, "/settings");

export const saveAdminSettings = (token: string, data: Partial<SiteSettings>) =>
  adminFetch<{ message: string }>(token, "/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });

// --- Custom Subtitles ---------------------------------------------------------

export interface CustomSubtitle {
  id: number;
  type: string;
  tmdb_id: number;
  season: number | null;
  episode: number | null;
  language: string;
  label: string;
  public_url: string;
  original_filename: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const getAdminSubtitles = (
  token: string,
  page = 1,
  type?: string,
  tmdbId?: number,
) => {
  const qs = new URLSearchParams({ page: String(page) });
  if (type) qs.set("type", type);
  if (tmdbId != null) qs.set("tmdb_id", String(tmdbId));
  // Subtitle routes are under /api/subtitles/admin, not /api/admin/subtitles
  return fetch(`${API_BASE}/subtitles/admin?${qs}`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }) as HeadersInit,
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      let msg = `Request failed: ${res.status}`;
      try { const b = await res.json(); msg = b?.message ?? msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json() as Promise<Paginated<CustomSubtitle>>;
  });
};

export const uploadAdminSubtitle = (
  token: string,
  data: {
    type: string;
    tmdb_id: number;
    season?: number | null;
    episode?: number | null;
    language: string;
    label: string;
    file: File;
  },
): Promise<CustomSubtitle> => {
  const form = new FormData();
  form.append("type", data.type);
  form.append("tmdb_id", String(data.tmdb_id));
  if (data.season != null) form.append("season", String(data.season));
  if (data.episode != null) form.append("episode", String(data.episode));
  form.append("language", data.language);
  form.append("label", data.label);
  form.append("file", data.file);

  // Use raw fetch so we don't set Content-Type (browser sets multipart boundary)
  return fetch(`${API_BASE}/subtitles/admin`, {
    method: "POST",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    body: form,
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      let msg = `Upload failed: ${res.status}`;
      try { const b = await res.json(); msg = b?.message ?? msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json() as Promise<CustomSubtitle>;
  });
};

export const deleteAdminSubtitle = (token: string, id: number) =>
  fetch(`${API_BASE}/subtitles/admin/${id}`, {
    method: "DELETE",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }) as HeadersInit,
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      let msg = `Request failed: ${res.status}`;
      try { const b = await res.json(); msg = b?.message ?? msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json() as Promise<{ message: string }>;
  });

// --- Video report (user-facing) -----------------------------------------------

export async function submitVideoReport(
  token: string,
  data: { type: string; tmdb_id: number; title?: string; reason: string; notes?: string },
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit report");
  return res.json();
}
