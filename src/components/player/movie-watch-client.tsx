"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VidstackPlayer from "@/components/player/vidstack-player";
import DetailMediaRow from "@/components/detail/detail-media-row";
import StreamDisclaimer from "@/components/player/stream-disclaimer";
import ReportVideoButton from "@/components/player/report-video-button";
import type { MediaItem } from "@/types/api";
import type { Genre } from "@/types/detail";

interface MovieWatchClientProps {
  id: string;
  movie: {
    title: string;
    overview: string | null;
    poster_url: string | null;
    vote_average: number;
    release_date: string;
    runtime: number | null;
    genres: Genre[];
    similar: MediaItem[];
  };
  detailSlug: string;
  streamToken: string;
}

export default function MovieWatchClient({
  id,
  movie,
  detailSlug,
  streamToken,
}: MovieWatchClientProps) {
  const tmdbId = parseInt(id, 10);

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-6">
        <Link
          href={`/movies/${detailSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {movie.title}
        </Link>

        <div className="space-y-4">
          <div className="w-full rounded-xl overflow-hidden shadow-2xl shadow-black/60">
            <VidstackPlayer
              streamApiUrl={`/api/stream/movie/${id}`}
              title={movie.title}
              posterUrl={movie.poster_url}
              tracking={{
                type: "movie",
                tmdbId,
                posterPath: movie.poster_url,
                voteAverage: movie.vote_average,
                releaseDate: movie.release_date,
              }}
              streamToken={streamToken}
            />
          </div>

          <StreamDisclaimer />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-zinc-400">
                {movie.release_date && (
                  <span>{movie.release_date.slice(0, 4)}</span>
                )}
                {movie.runtime && (
                  <span>
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}
                {movie.genres.slice(0, 3).map((g) => (
                  <span
                    key={g.id}
                    className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-xs"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
              {movie.overview && (
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-3xl line-clamp-2">
                  {movie.overview}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <ReportVideoButton
                type="movie"
                tmdbId={tmdbId}
                title={movie.title}
              />
            </div>
          </div>

          {movie.similar.length > 0 && (
            <div className="mt-10 border-t border-white/5 pt-8">
              <DetailMediaRow title="More Like This" items={movie.similar} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
