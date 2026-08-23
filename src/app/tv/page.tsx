import { Suspense } from "react";
import type { Metadata } from "next";
import { discoverTv } from "@/lib/api";
import { TV_GENRES, TV_SORT_OPTIONS } from "@/types/tmdb";
import type { SortOption } from "@/types/tmdb";
import FiltersBar from "@/components/filters-bar";
import MediaGrid from "@/components/media-grid";
import Pagination from "@/components/pagination";
import { MediaGridSkeleton, FiltersSkeleton } from "@/components/skeletons";

// ISR: revalidate every 5 minutes — TV lists don't change second-to-second.
// Pages with unique filter params are rendered on-demand and cached individually.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "TV Shows — FlixWorld",
  description: "Browse and discover TV series by genre, rating, and more.",
};

interface TvPageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
  }>;
}

async function TvContent({ searchParams }: TvPageProps) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = (params.sort as SortOption) ?? "popularity.desc";
  const genres = params.genres ?? "";
  const yearFrom = params.year_from ?? "";
  const yearTo = params.year_to ?? "";

  const result = await discoverTv({
    page,
    sort_by: sort,
    with_genres: genres || undefined,
    ...(yearFrom ? { "first_air_date.gte": `${yearFrom}-01-01` } : {}),
    ...(yearTo ? { "first_air_date.lte": `${yearTo}-12-31` } : {}),
  });

  return (
    <>
      {/* Sticky filter bar — needs its own Suspense since it uses useSearchParams */}
      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersBar
          genres={TV_GENRES}
          sortOptions={TV_SORT_OPTIONS}
          totalResults={result.total_results}
        />
      </Suspense>

      <div className="px-6 md:px-12 lg:px-20 pt-8">
        <MediaGrid items={result.items} />

        <Suspense>
          <Pagination
            currentPage={result.page}
            totalPages={result.total_pages}
          />
        </Suspense>
      </div>
    </>
  );
}

export default function TvPage(props: TvPageProps) {
  return (
    <div className="min-h-screen pt-16 bg-black">
      {/* Page header */}
      <div className="px-6 md:px-12 lg:px-20 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">TV Shows</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Stream the latest and greatest series from around the world.
        </p>
      </div>

      <Suspense
        fallback={
          <>
            <FiltersSkeleton />
            <div className="px-6 md:px-12 lg:px-20 pt-8">
              <MediaGridSkeleton />
            </div>
          </>
        }
      >
        <TvContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
