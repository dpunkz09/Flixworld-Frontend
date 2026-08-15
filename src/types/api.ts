export interface MediaItem {
  id: number;
  type: "movie" | "tv";
  title: string;
  overview: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number | string;
  release_date: string;
  tagline?: string | null;
  favorite_count?: number;
  watch_count?: number;
}

export interface MostWatchedItem {
  id: number;
  type: "movie" | "tv";
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  release_year: number | null;
  watch_count: number;
  created_at: string;
  updated_at: string;
}

export interface HeroCarousel {
  title: string;
  source: string;
  items: MediaItem[];
}

export interface MediaSection {
  title: string;
  source: string;
  movies: MediaItem[];
  tv: MediaItem[];
}

export interface HomepageData {
  hero_carousel: HeroCarousel;
  most_favorite: MediaSection;
  now_playing: MediaSection;
  popular: MediaSection;
  top_rated: MediaSection;
  upcoming: MediaSection;
}

export interface BecauseYouWatchedRow {
  seed: { id: number; type: "movie" | "tv"; title: string };
  items: MediaItem[];
}
