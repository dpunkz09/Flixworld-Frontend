"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Film, Tv, Star, BookmarkX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { slugify } from "@/lib/slug";
import type { WishlistItem } from "@/types/wishlist";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

function getPosterUrl(item: WishlistItem): string | null {
  if (!item.poster_path) return null;
  if (item.poster_path.startsWith("http")) return item.poster_path;
  return `${TMDB_IMG}${item.poster_path.startsWith("/") ? "" : "/"}${item.poster_path}`;
}

function getRating(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) || num === 0 ? "N/A" : num.toFixed(1);
}

function getYear(dateStr: string): string {
  return dateStr?.slice(0, 4) ?? "";
}

function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: () => void;
}) {
  const href = item.type === "movie"
    ? `/movies/${slugify(item.title, item.tmdb_id)}`
    : `/tv/${slugify(item.title, item.tmdb_id)}`;
  const posterUrl = getPosterUrl(item);

  return (
    <div className="group relative">
      <Link href={href} className="block">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-white/30 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-black/60">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 176px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-800 text-zinc-500">
              {item.type === "tv" ? (
                <Tv className="w-10 h-10" />
              ) : (
                <Film className="w-10 h-10" />
              )}
              <span className="text-xs text-center px-2 line-clamp-2">
                {item.title}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

          {/* Rating */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5 backdrop-blur-sm">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-white">
              {getRating(item.vote_average)}
            </span>
          </div>

          {/* Type pill */}
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-red-600/90 text-white px-1.5 py-0.5 rounded">
              {item.type === "tv" ? "TV" : "Movie"}
            </span>
          </div>
        </div>

        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">
            {item.title}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{getYear(item.release_date)}</p>
        </div>
      </Link>

      {/* Remove button — appears on hover */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        aria-label={`Remove ${item.title} from My List`}
        className="absolute top-10 right-1 z-10 p-1.5 rounded-full bg-black/70 text-zinc-400 hover:text-red-400 hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function MyListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, loading: wishlistLoading, toggle } = useWishlist();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  const movies = items.filter((i) => i.type === "movie");
  const tvShows = items.filter((i) => i.type === "tv");

  function handleRemove(item: WishlistItem) {
    void toggle({
      type: item.type,
      tmdb_id: item.tmdb_id,
    });
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Header */}
      <div className="px-6 md:px-12 lg:px-20 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white">My List</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          {wishlistLoading
            ? "Loading your saved titles…"
            : items.length === 0
            ? "Nothing saved yet. Browse movies and TV shows to build your list."
            : `${items.length} saved title${items.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Loading skeletons */}
      {wishlistLoading && (
        <div className="px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 gap-y-8">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[2/3] w-full rounded-lg bg-zinc-800 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-zinc-800 animate-pulse" />
                <div className="h-3 w-1/3 rounded bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!wishlistLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500 gap-4">
          <BookmarkX className="w-16 h-16 text-zinc-700" />
          <p className="text-lg font-medium text-zinc-400">Your list is empty</p>
          <p className="text-sm">
            Hit the{" "}
            <span className="text-white font-semibold">+ My List</span> button on
            any movie or TV show to save it here.
          </p>
          <div className="flex gap-3 mt-2">
            <Link
              href="/movies"
              className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
            >
              Browse Movies
            </Link>
            <Link
              href="/tv"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors border border-white/20"
            >
              Browse TV Shows
            </Link>
          </div>
        </div>
      )}

      {/* Movies section */}
      {!wishlistLoading && movies.length > 0 && (
        <section className="px-6 md:px-12 lg:px-20 mb-12">
          <h2 className="text-xl font-semibold text-white mb-5">
            Movies
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({movies.length})
            </span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-8">
            {movies.map((item) => (
              <WishlistCard
                key={`${item.type}-${item.tmdb_id}`}
                item={item}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* TV Shows section */}
      {!wishlistLoading && tvShows.length > 0 && (
        <section className="px-6 md:px-12 lg:px-20 mb-12">
          <h2 className="text-xl font-semibold text-white mb-5">
            TV Shows
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({tvShows.length})
            </span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-8">
            {tvShows.map((item) => (
              <WishlistCard
                key={`${item.type}-${item.tmdb_id}`}
                item={item}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
