/**
 * tmdb.ts — shared type definitions only.
 *
 * All runtime TMDB calls now go through the NestJS backend (lib/api.ts).
 * This file exists purely to export interfaces that api.ts re-exports to
 * the rest of the frontend so no imports break.
 */

import type { MediaItem } from "@/types/api";

// ─── Exported interfaces (consumed by lib/api.ts) ────────────────────────────

export interface SearchResult {
  items: MediaItem[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface DiscoverResult {
  items: MediaItem[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_url: string | null;
  known_for_department: string;
  popularity: number;
}

export interface PersonCredits {
  movies: MediaItem[];
  tv: MediaItem[];
}

export interface CompanyDetails {
  id: number;
  name: string;
  logo_url: string | null;
  origin_country: string;
  description: string;
  headquarters: string;
  homepage: string;
  parent_company: { id: number; name: string } | null;
}

export interface NetworkDetails {
  id: number;
  name: string;
  logo_url: string | null;
  origin_country: string;
  headquarters: string;
  homepage: string;
}
