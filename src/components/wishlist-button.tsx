"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import type { AddToWishlistPayload } from "@/types/wishlist";

interface WishlistButtonProps {
  tmdbId: number;
  type: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  voteAverage?: number | string;
  releaseDate?: string;
  /** Optional extra className for the button wrapper */
  className?: string;
}

/**
 * The API expects a raw TMDB path like `/abc.jpg`, not a full URL.
 * Extract the path portion when a full URL is passed.
 */
function normalizePosterPath(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.pathname; // e.g. /t/p/w500/abc.jpg
  } catch {
    // Not a URL — already a raw path
    return value.startsWith("/") ? value : `/${value}`;
  }
}

export default function WishlistButton({
  tmdbId,
  type,
  title,
  posterPath,
  voteAverage,
  releaseDate,
  className = "",
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { isInWishlist, toggle } = useWishlist();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const inList = isInWishlist(type, tmdbId);

  async function handleClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      const payload: AddToWishlistPayload = {
        type,
        tmdb_id: tmdbId,
        title,
        poster_path: normalizePosterPath(posterPath),
        vote_average: voteAverage,
        release_date: releaseDate,
      };
      await toggle(payload);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={inList ? "Remove from My List" : "Add to My List"}
      aria-pressed={inList}
      className={`inline-flex items-center gap-2 font-semibold rounded-full px-6 py-3 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        inList
          ? "bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
          : "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
      } ${className}`}
    >
      {inList ? (
        <BookmarkCheck className="w-4 h-4 fill-white" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {inList ? "In My List" : "+ My List"}
    </button>
  );
}
