import { Suspense } from "react";
import { getHomepageData, getMostWatched } from "@/lib/api";
import HeroCarousel from "@/components/hero-carousel";
import TabbedMediaRow from "@/components/tabbed-media-row";
import MediaRow from "@/components/media-row";
import ContinueWatchingRow from "@/components/continue-watching-row";
import BecauseYouWatched from "@/components/because-you-watched";
import LoginPromptBanner from "@/components/login-prompt-banner";
import { HeroSkeleton, MediaRowSkeleton } from "@/components/skeletons";
import type { HomepageData, MostWatchedItem } from "@/types/api";
import type { MediaItem } from "@/types/api";

// ISR: revalidate every 10 minutes (matches CACHE_HOMEPAGE_TTL default)
export const revalidate = 600;

// Async component that renders the hero from pre-fetched data
function Hero({ items }: { items: HomepageData["hero_carousel"]["items"] }) {
  return <HeroCarousel items={items} />;
}

// Async component that renders all content rows from pre-fetched data
function ContentRows({
  data,
  mostWatchedItems,
}: {
  data: HomepageData;
  mostWatchedItems: MediaItem[];
}) {
  const { most_favorite, popular, top_rated } = data;

  return (
    <div className="pb-8 space-y-6">
      {mostWatchedItems.length > 0 && (
        <MediaRow title="Most Watched" items={mostWatchedItems} />
      )}
      <TabbedMediaRow section={most_favorite} />
      <TabbedMediaRow section={popular} />
      <TabbedMediaRow section={top_rated} />
    </div>
  );
}

export default async function HomePage() {
  // Fetch both in parallel — one network round-trip total
  const [data, mostWatched] = await Promise.all([
    getHomepageData(),
    getMostWatched().catch(() => [] as MostWatchedItem[]),
  ]);

  const mostWatchedItems: MediaItem[] = mostWatched.map((item) => ({
    id: item.tmdb_id,
    type: item.type,
    title: item.title,
    overview: null,
    poster_url: item.poster_path,
    backdrop_url: null,
    vote_average: item.vote_average ?? 0,
    release_date: item.release_year ? `${item.release_year}-01-01` : "",
    watch_count: item.watch_count,
  }));

  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero items={data.hero_carousel.items} />
      </Suspense>

      <div className="relative z-10 -mt-2 bg-black">
        {/* Login prompt — shown to logged-out users, dismissable */}
        <LoginPromptBanner />

        {/* Continue Watching - client component, renders based on auth state */}
        <ContinueWatchingRow />

        {/* Because You Watched - personalised recommendations, client component */}
        <BecauseYouWatched />

        <Suspense
          fallback={
            <div className="space-y-8 pt-8">
              <MediaRowSkeleton />
              <MediaRowSkeleton />
              <MediaRowSkeleton />
            </div>
          }
        >
          <ContentRows data={data} mostWatchedItems={mostWatchedItems} />
        </Suspense>
      </div>
    </>
  );
}
