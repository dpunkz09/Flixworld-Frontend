import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTvDetail } from "@/lib/api";
import { extractId, slugify } from "@/lib/slug";
import DetailHero from "@/components/detail/detail-hero";
import CastRow from "@/components/detail/cast-row";
import VideosRow from "@/components/detail/videos-row";
import SeasonsAccordion from "@/components/detail/seasons-accordion";
import DetailSidebar from "@/components/detail/detail-sidebar";
import DetailMediaRow from "@/components/detail/detail-media-row";
import CommentsSection from "@/components/comments/comments-section";

interface TvPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: TvPageProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const show = await getTvDetail(extractId(slug));
    const canonicalSlug = slugify(show.title, show.id);
    return {
      title: show.title,
      description: show.overview ?? undefined,
      alternates: { canonical: `https://flixworld.xyz/tv/${canonicalSlug}` },
      openGraph: {
        type: "video.tv_show",
        title: show.title,
        description: show.overview ?? undefined,
        url: `https://flixworld.xyz/tv/${canonicalSlug}`,
        images: show.backdrop_url
          ? [{ url: show.backdrop_url, width: 1280, height: 720, alt: show.title }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: show.title,
        description: show.overview?.slice(0, 200) ?? undefined,
        images: show.backdrop_url ? [show.backdrop_url] : [],
      },
    };
  } catch {
    return { title: "TV Show — FlixWorld" };
  }
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatRuntime(times: number[]) {
  if (!times?.length) return "—";
  return `~${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}m / episode`;
}

export default async function TvDetailPage(props: TvPageProps) {
  const { slug } = await props.params;

  let show;
  try {
    show = await getTvDetail(extractId(slug));
  } catch {
    notFound();
  }

  const trailer =
    show.videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    show.videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    show.videos.find((v) => v.site === "YouTube");

  const heroMeta = [
    { label: "First Aired", value: formatDate(show.release_date) },
    { label: "Seasons", value: show.number_of_seasons ? `${show.number_of_seasons} season${show.number_of_seasons !== 1 ? "s" : ""}` : "—" },
    { label: "Episodes", value: show.number_of_episodes ? String(show.number_of_episodes) : "—" },
    { label: "Status", value: show.status },
  ].filter((m) => m.value !== "—");

  const facts = [
    { label: "Original Title", value: show.original_title !== show.title ? show.original_title : "" },
    { label: "Language", value: show.original_language.toUpperCase() },
    { label: "Episode Runtime", value: formatRuntime(show.episode_run_time) },
    { label: "Created By", value: show.created_by?.map((c) => c.name).join(", ") ?? "—" },
    { label: "Last Aired", value: show.last_air_date ? formatDate(show.last_air_date) : "—" },
    { label: "Spoken Languages", value: show.spoken_languages.map((l) => l.name).join(", ") },
  ].filter((f) => f.value && f.value !== "—");

  const watchSlug = slugify(show.title, show.id);

  return (
    <div className="min-h-screen bg-black pt-16">
      <DetailHero
        title={show.title}
        tagline={show.tagline}
        overview={show.overview}
        posterUrl={show.poster_url}
        backdropUrl={show.backdrop_url}
        voteAverage={show.vote_average}
        voteCount={show.vote_count}
        genres={show.genres}
        metaLeft={heroMeta}
        homepage={show.homepage}
        trailerKey={trailer?.key}
        watchHref={`/watch/tv/${watchSlug}`}
        wishlist={{ tmdbId: show.id, type: "tv", posterPath: show.poster_url, releaseDate: show.release_date }}
      />

      <div className="max-w-[1600px] mx-auto">
        <CastRow cast={show.cast} />
        <SeasonsAccordion seasons={show.seasons ?? []} tmdbId={show.id} />
        <VideosRow videos={show.videos} />

        <div className="px-6 md:px-12 lg:px-20 py-8 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Storyline</h2>
              <p className="text-zinc-300 leading-relaxed">{show.overview ?? "No overview available."}</p>
            </div>
            <DetailSidebar facts={facts} externalIds={show.external_ids ?? {}} productionCompanies={show.production_companies} keywords={show.keywords} networks={show.networks} />
          </div>
        </div>

        <DetailMediaRow title="Recommended" items={show.recommendations} />
        <DetailMediaRow title="More Like This" items={show.similar} />
        <CommentsSection type="tv" tmdbId={show.id} mediaTitle={show.title} />
      </div>
    </div>
  );
}
