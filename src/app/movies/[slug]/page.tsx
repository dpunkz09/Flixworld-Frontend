import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieDetail } from "@/lib/api";
import { extractId, slugify } from "@/lib/slug";
import DetailHero from "@/components/detail/detail-hero";
import CastRow from "@/components/detail/cast-row";
import VideosRow from "@/components/detail/videos-row";
import DetailSidebar from "@/components/detail/detail-sidebar";
import DetailMediaRow from "@/components/detail/detail-media-row";
import CommentsSection from "@/components/comments/comments-section";

interface MoviePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: MoviePageProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const movie = await getMovieDetail(extractId(slug));
    const canonicalSlug = slugify(movie.title, movie.id);
    return {
      title: movie.title,
      description: movie.overview ?? undefined,
      alternates: { canonical: `https://flixworld.xyz/movies/${canonicalSlug}` },
      openGraph: {
        type: "video.movie",
        title: movie.title,
        description: movie.overview ?? undefined,
        url: `https://flixworld.xyz/movies/${canonicalSlug}`,
        images: movie.backdrop_url
          ? [{ url: movie.backdrop_url, width: 1280, height: 720, alt: movie.title }]
          : [],
        releaseDate: movie.release_date || undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: movie.title,
        description: movie.overview?.slice(0, 200) ?? undefined,
        images: movie.backdrop_url ? [movie.backdrop_url] : [],
      },
    };
  } catch {
    return { title: "Movie — FlixWorld" };
  }
}

function formatCurrency(n: number) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatRuntime(mins: number | null) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default async function MovieDetailPage(props: MoviePageProps) {
  const { slug } = await props.params;

  let movie;
  try {
    movie = await getMovieDetail(extractId(slug));
  } catch {
    notFound();
  }

  const trailer = movie.videos.find(
    (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
  ) ?? movie.videos.find((v) => v.site === "YouTube" && v.type === "Trailer")
    ?? movie.videos.find((v) => v.site === "YouTube");

  const heroMeta = [
    { label: "Released", value: formatDate(movie.release_date) },
    { label: "Runtime", value: formatRuntime(movie.runtime) },
    { label: "Status", value: movie.status },
  ].filter((m) => m.value !== "—");

  const facts = [
    { label: "Original Title", value: movie.original_title !== movie.title ? movie.original_title : "" },
    { label: "Language", value: movie.original_language.toUpperCase() },
    { label: "Spoken Languages", value: movie.spoken_languages.map((l) => l.name).join(", ") },
    { label: "Countries", value: movie.production_countries.map((c) => c.name).join(", ") },
    { label: "Budget", value: formatCurrency(movie.budget) },
    { label: "Revenue", value: formatCurrency(movie.revenue) },
    ...(movie.collection ? [{ label: "Part of", value: movie.collection.name }] : []),
  ].filter((f) => f.value && f.value !== "—");

  const watchSlug = slugify(movie.title, movie.id);

  return (
    <div className="min-h-screen bg-black pt-16">
      <DetailHero
        title={movie.title}
        tagline={movie.tagline}
        overview={movie.overview}
        posterUrl={movie.poster_url}
        backdropUrl={movie.backdrop_url}
        voteAverage={movie.vote_average}
        voteCount={movie.vote_count}
        genres={movie.genres}
        metaLeft={heroMeta}
        homepage={movie.homepage}
        trailerKey={trailer?.key}
        watchHref={`/watch/movie/${watchSlug}`}
        wishlist={{ tmdbId: movie.id, type: "movie", posterPath: movie.poster_url, releaseDate: movie.release_date }}
      />

      <div className="max-w-[1600px] mx-auto">
        <CastRow cast={movie.cast} />
        <VideosRow videos={movie.videos} />

        <div className="px-6 md:px-12 lg:px-20 py-8 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Storyline</h2>
              <p className="text-zinc-300 leading-relaxed">{movie.overview ?? "No overview available."}</p>
            </div>
            <DetailSidebar facts={facts} externalIds={movie.external_ids ?? {}} productionCompanies={movie.production_companies} keywords={movie.keywords} />
          </div>
        </div>

        <DetailMediaRow title="Recommended" items={movie.recommendations} />
        <DetailMediaRow title="More Like This" items={movie.similar} />
        <CommentsSection type="movie" tmdbId={movie.id} mediaTitle={movie.title} />
      </div>
    </div>
  );
}
