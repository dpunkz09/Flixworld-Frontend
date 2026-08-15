import type { MediaItem } from "@/types/api";

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_url: string | null;
  origin_country: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_url: string | null;
  order: number;
}

export interface Video {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
  official: boolean;
  url: string;
}

export interface Collection {
  id: number;
  name: string;
  poster_url: string | null;
  backdrop_url: string | null;
}

export interface ExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  wikidata_id?: string | null;
}

export interface Keyword {
  id: number;
  name: string;
}

// ─── Movie ───────────────────────────────────────────────────────────────────

export interface MovieDetail {
  id: number;
  type: "movie";
  title: string;
  original_title: string;
  overview: string | null;
  tagline: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_date: string;
  runtime: number | null;
  status: string;
  adult: boolean;
  original_language: string;
  homepage: string | null;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  external_ids: ExternalIds;
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  collection: Collection | null;
  keywords: Keyword[];
  cast: CastMember[];
  videos: Video[];
  recommendations: MediaItem[];
  similar: MediaItem[];
}

// ─── TV ──────────────────────────────────────────────────────────────────────

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  still_url: string | null;
  production_code: string;
  guest_stars: CastMember[];
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  overview: string;
  poster_url: string | null;
  episodes: Episode[];
}

export interface Network {
  id: number;
  name: string;
  logo_url: string | null;
  origin_country: string;
}

export interface Creator {
  id: number;
  name: string;
  profile_url: string | null;
}

export interface TvDetail {
  id: number;
  type: "tv";
  title: string;
  original_title: string;
  overview: string | null;
  tagline: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_date: string; // first_air_date mapped to this
  last_air_date: string;
  status: string;
  in_production: boolean;
  original_language: string;
  homepage: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  external_ids: ExternalIds;
  genres: Genre[];
  networks: Network[];
  created_by: Creator[];
  production_companies: ProductionCompany[];
  spoken_languages: { iso_639_1: string; name: string }[];
  keywords: Keyword[];
  cast: CastMember[];
  seasons: Season[];
  videos: Video[];
  recommendations: MediaItem[];
  similar: MediaItem[];
}
