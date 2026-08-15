import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Calendar, Globe, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Genre } from "@/types/detail";
import WishlistButton from "@/components/wishlist-button";
import ResumeButton from "@/components/resume-button";

interface DetailHeroProps {
  title: string;
  tagline?: string | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  metaLeft: { label: string; value: string }[];
  homepage?: string | null;
  trailerKey?: string | null;
  /** Link to the watch page — shows the Watch Now button when provided */
  watchHref?: string;
  /** When provided, renders the wishlist toggle button */
  wishlist?: {
    tmdbId: number;
    type: "movie" | "tv";
    posterPath?: string | null;
    releaseDate?: string;
  };
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DetailHero({
  title,
  tagline,
  overview,
  posterUrl,
  backdropUrl,
  voteAverage,
  voteCount,
  genres,
  metaLeft,
  homepage,
  trailerKey,
  watchHref,
  wishlist,
}: DetailHeroProps) {
  return (
    <section className="relative w-full min-h-[70vh]">
      {/* Backdrop */}
      {backdropUrl && (
        <div className="absolute inset-0">
          <Image
            src={backdropUrl}
            alt={`${title} backdrop`}
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        </div>
      )}
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-end min-h-[70vh] pb-12 px-6 md:px-12 lg:px-20">
        <div className="flex gap-8 items-end w-full max-w-6xl">
          {/* Poster — hidden on mobile, shown md+ */}
          {posterUrl && (
            <div className="hidden md:block flex-shrink-0 w-44 lg:w-52 rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 self-end">
              <Image
                src={posterUrl}
                alt={`${title} poster`}
                width={208}
                height={312}
                className="w-full object-cover"
                priority
              />
            </div>
          )}

          {/* Text info */}
          <div className="flex-1 space-y-4">
            {/* Genre badges */}
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <Badge
                  key={g.id}
                  variant="secondary"
                  className="bg-white/10 text-white border-white/20 text-xs backdrop-blur-sm"
                >
                  {g.name}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              {title}
            </h1>

            {/* Tagline */}
            {tagline && (
              <p className="text-base text-zinc-300 italic">{tagline}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-white">
                  {voteAverage.toFixed(1)}
                </span>
                <span className="text-zinc-400 text-xs">
                  ({voteCount.toLocaleString()})
                </span>
              </div>
              {metaLeft.map((m) => (
                <div key={m.label} className="flex items-center gap-1.5 text-zinc-300">
                  {m.label === "Runtime" && <Clock className="w-4 h-4 text-zinc-500" />}
                  {m.label === "Released" && <Calendar className="w-4 h-4 text-zinc-500" />}
                  {m.label === "Status" && <Globe className="w-4 h-4 text-zinc-500" />}
                  <span className="text-zinc-500 text-xs">{m.label}:</span>
                  <span className="font-medium">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Overview */}
            {overview && (
              <p className="text-zinc-300 leading-relaxed max-w-2xl text-sm md:text-base line-clamp-4">
                {overview}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-1">
              {/* Watch Now — primary CTA */}
              {watchHref && (
                <Link
                  href={watchHref}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-7 py-3 text-sm transition-colors shadow-lg shadow-red-600/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Now
                </Link>
              )}
              {/* Resume button — client component, only renders if user has progress */}
              {wishlist && (
                <ResumeButton type={wishlist.type} tmdbId={wishlist.tmdbId} />
              )}
              {trailerKey && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailerKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full px-6 py-3 text-sm transition-colors backdrop-blur-sm border border-white/20"
                >
                  ▶ Trailer
                </a>
              )}
              {wishlist && (
                <WishlistButton
                  tmdbId={wishlist.tmdbId}
                  type={wishlist.type}
                  title={title}
                  posterPath={wishlist.posterPath}
                  voteAverage={voteAverage}
                  releaseDate={wishlist.releaseDate}
                />
              )}
              {homepage && (
                <a
                  href={homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 rounded-full px-5 py-3 text-sm transition-colors backdrop-blur-sm"
                >
                  Official Site ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
