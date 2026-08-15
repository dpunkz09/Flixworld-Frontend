export interface WishlistItem {
  id: number;
  user_id: number;
  type: "movie" | "tv";
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number | string;
  release_date: string;
  created_at: string;
  updated_at: string;
}

export interface AddToWishlistPayload {
  type: "movie" | "tv";
  tmdb_id: number;
  title?: string;
  poster_path?: string | null;
  vote_average?: number | string;
  release_date?: string;
}
