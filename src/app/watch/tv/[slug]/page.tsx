import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTvDetail } from "@/lib/api";
import { extractId } from "@/lib/slug";
import { generateStreamToken } from "@/lib/stream-token";
import TvWatchClient from "@/components/player/tv-watch-client";

// searchParams makes this page inherently dynamic
export const dynamic = "force-dynamic";

interface WatchTvProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}

export async function generateMetadata(props: WatchTvProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const show = await getTvDetail(extractId(slug));
    return {
      title: `Watch ${show.title}`,
      description: show.overview ?? undefined,
    };
  } catch {
    return { title: "Watch — FlixWorld" };
  }
}

export default async function WatchTvPage(props: WatchTvProps) {
  const { slug } = await props.params;
  const id = extractId(slug);
  const sp = await props.searchParams;

  let show;
  try {
    show = await getTvDetail(id);
  } catch {
    notFound();
  }

  const seasons = (show.seasons ?? []).filter((s) => s.season_number > 0);
  const defaultSeason = seasons[0]?.season_number ?? 1;
  const defaultEpisode = seasons[0]?.episodes?.[0]?.episode_number ?? 1;

  const initialSeason = parseInt(sp.season ?? String(defaultSeason), 10) || defaultSeason;
  const initialEpisode = parseInt(sp.episode ?? String(defaultEpisode), 10) || defaultEpisode;
  const streamToken = await generateStreamToken("tv", id);

  return (
    <TvWatchClient
      id={id}
      show={{
        title: show.title,
        overview: show.overview,
        poster_url: show.poster_url,
        voteAverage: show.vote_average,
        releaseDate: show.release_date,
        genres: show.genres,
        similar: show.similar,
        seasons: seasons.map((s) => ({
          id: s.id,
          season_number: s.season_number,
          name: s.name,
          episode_count: s.episode_count,
          episodes: s.episodes.map((e) => ({
            id: e.id,
            episode_number: e.episode_number,
            season_number: e.season_number,
            name: e.name,
            overview: e.overview,
            still_url: e.still_url,
            runtime: e.runtime,
            air_date: e.air_date,
            vote_average: e.vote_average,
          })),
        })),
      }}
      initialSeason={initialSeason}
      initialEpisode={initialEpisode}
      streamToken={streamToken}
    />
  );
}
