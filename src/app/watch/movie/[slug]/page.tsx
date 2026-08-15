import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieDetail } from "@/lib/api";
import { extractId, slugify } from "@/lib/slug";
import { generateStreamToken } from "@/lib/stream-token";
import MovieWatchClient from "@/components/player/movie-watch-client";

// searchParams makes this page inherently dynamic
export const dynamic = "force-dynamic";

interface WatchMovieProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: WatchMovieProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const movie = await getMovieDetail(extractId(slug));
    return {
      title: `Watch ${movie.title}`,
      description: movie.overview ?? undefined,
    };
  } catch {
    return { title: "Watch — FlixWorld" };
  }
}

export default async function WatchMoviePage(props: WatchMovieProps) {
  const { slug } = await props.params;
  const id = extractId(slug);

  let movie;
  try {
    movie = await getMovieDetail(id);
  } catch {
    notFound();
  }

  const detailSlug = slugify(movie.title, movie.id);
  const streamToken = await generateStreamToken("movie", id);

  return (
    <MovieWatchClient
      id={String(id)}
      movie={{
        title: movie.title,
        overview: movie.overview ?? null,
        poster_url: movie.poster_url ?? null,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        runtime: movie.runtime ?? null,
        genres: movie.genres,
        similar: movie.similar,
      }}
      detailSlug={detailSlug}
      streamToken={streamToken}
    />
  );
}
