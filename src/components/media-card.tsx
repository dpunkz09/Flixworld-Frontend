import Link from "next/link";
import { Star, Tv, Film, Heart, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/slug";
import type { MediaItem } from "@/types/api";

interface MediaCardProps {
  item: MediaItem;
  /** When true, the card fills its parent width instead of using fixed row widths */
  gridMode?: boolean;
  /** Mark the image as high-priority (LCP candidate). Only set for the first visible card. */
  priority?: boolean;
}

function getRating(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "N/A" : num.toFixed(1);
}

function getYear(dateStr: string): string {
  return dateStr?.slice(0, 4) ?? "";
}

export default function MediaCard({ item, gridMode = false, priority = false }: MediaCardProps) {
  const href = item.type === "movie"
    ? `/movies/${slugify(item.title, item.id)}`
    : `/tv/${slugify(item.title, item.id)}`;

  return (
    <Link
      href={href}
      className={`group relative cursor-pointer ${
        gridMode ? "w-full" : "flex-shrink-0 w-32 sm:w-36 md:w-44"
      }`}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-white/30 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/60">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-800 text-zinc-500">
            {item.type === "tv" ? (
              <Tv className="w-10 h-10" />
            ) : (
              <Film className="w-10 h-10" />
            )}
            <span className="text-xs text-center px-2 line-clamp-2">{item.title}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

        {/* Rating badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5 backdrop-blur-sm">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-semibold text-white">
            {getRating(item.vote_average)}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 font-semibold uppercase tracking-wide bg-red-600/90 text-white border-0"
          >
            {item.type === "tv" ? "TV" : "Movie"}
          </Badge>
        </div>

        {/* favorite_count badge */}
        {item.favorite_count != null && item.favorite_count > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5 backdrop-blur-sm">
            <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
            <span className="text-[10px] font-semibold text-white">
              {item.favorite_count}
            </span>
          </div>
        )}

        {/* watch_count badge */}
        {item.watch_count != null && item.watch_count > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5 backdrop-blur-sm">
            <Eye className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-semibold text-white">
              {item.watch_count}
            </span>
          </div>
        )}
      </div>

      {/* Title & year */}
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">
          {item.title}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">{getYear(item.release_date)}</p>
      </div>
    </Link>
  );
}
