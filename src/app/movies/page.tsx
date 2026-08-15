import { Suspense } from "react";
import type { Metadata } from "next";
import { discoverMovies } from "@/lib/api";
import { MOVIE_GENRES, MOVIE_SORT_OPTIONS } from "@/types/tmdb";
import type { SortOption } from "@/types/tmdb";
import FiltersBar from "@/components/filters-bar";
import MediaGrid from "@/components/media-grid";
import Pagination from "@/components/pagination";
import { MediaGridSkeleton, FiltersSkeleton } from "@/components/skeletons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Movies — FlixWorld",
  description: "Browse and discover movies by genre, rating, and more.",
};

interface MoviesPageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
  }>;
}

async function MoviesContent({ searchParams }: MoviesPageProps) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = (params.sort as SortOption) ?? "popularity.desc";
  const genres = params.genres ?? "";
  const yearFrom = params.year_from ?? "";
  const yearTo = params.year_to ?? "";

  const result = await discoverMovies({
    page,
    sort_by: sort,
    with_genres: genres || undefined,
    ...(yearFrom ? { "primary_release_date.gte": `${yearFrom}-01-01` } : {}),
    ...(yearTo ? { "primary_release_date.lte": `${yearTo}-12-31` } : {}),
  });

  return (
    <>
      {/* Sticky filter bar — needs its own Suspense since it uses useSearchParams */}
      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersBar
          genres={MOVIE_GENRES}
          sortOptions={MOVIE_SORT_OPTIONS}
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

export default function MoviesPage(props: MoviesPageProps) {
  return (
    <div className="min-h-screen pt-16 bg-black">
      {/* Page header */}
      <div className="px-6 md:px-12 lg:px-20 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Movies</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Discover films from every genre, era, and corner of the world.
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
        <MoviesContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
