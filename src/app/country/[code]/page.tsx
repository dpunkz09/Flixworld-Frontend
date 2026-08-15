import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  discoverMoviesByCountry,
  discoverTvByCountry,
} from "@/lib/api";
import {
  COUNTRIES,
  MOVIE_GENRES,
  TV_GENRES,
  COUNTRY_SORT_OPTIONS,
} from "@/types/tmdb";
import type { SortOption } from "@/types/tmdb";
import FiltersBar from "@/components/filters-bar";
import MediaGrid from "@/components/media-grid";
import Pagination from "@/components/pagination";
import CountryTabs from "@/components/country-tabs";
import { MediaGridSkeleton, FiltersSkeleton } from "@/components/skeletons";

export const dynamic = "force-dynamic";

interface CountryPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
    tab?: string;
  }>;
}

export async function generateMetadata(
  props: CountryPageProps
): Promise<Metadata> {
  const { code } = await props.params;
  const country = COUNTRIES.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
  if (!country) return { title: "Country — FlixWorld" };
  return {
    title: `${country.flag} ${country.name} — FlixWorld`,
    description: `Browse movies and TV shows from ${country.name} on FlixWorld.`,
  };
}

async function CountryContent({
  code,
  searchParams,
}: {
  code: string;
  searchParams: CountryPageProps["searchParams"];
}) {
  const params = await searchParams;
  const tab = params.tab === "tv" ? "tv" : "movies";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = (params.sort as SortOption) ?? "popularity.desc";
  const genres = params.genres ?? "";
  const yearFrom = params.year_from ?? "";
  const yearTo = params.year_to ?? "";

  const isMovies = tab === "movies";

  const result = isMovies
    ? await discoverMoviesByCountry({
        countryCode: code.toUpperCase(),
        page,
        sort_by: sort,
        with_genres: genres || undefined,
        ...(yearFrom
          ? { "primary_release_date.gte": `${yearFrom}-01-01` }
          : {}),
        ...(yearTo
          ? { "primary_release_date.lte": `${yearTo}-12-31` }
          : {}),
      })
    : await discoverTvByCountry({
        countryCode: code.toUpperCase(),
        page,
        sort_by: sort,
        with_genres: genres || undefined,
        ...(yearFrom ? { "first_air_date.gte": `${yearFrom}-01-01` } : {}),
        ...(yearTo ? { "first_air_date.lte": `${yearTo}-12-31` } : {}),
      });

  return (
    <>
      {/* Movie / TV tab switcher */}
      <Suspense>
        <CountryTabs activeTab={tab} />
      </Suspense>

      {/* Filters bar */}
      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersBar
          genres={isMovies ? MOVIE_GENRES : TV_GENRES}
          sortOptions={COUNTRY_SORT_OPTIONS}
          totalResults={result.total_results}
        />
      </Suspense>

      <div className="px-4 md:px-12 lg:px-20 pt-8">
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

export default async function CountryPage(props: CountryPageProps) {
  const { code } = await props.params;
  const country = COUNTRIES.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
  if (!country) notFound();

  return (
    <div className="min-h-screen pt-16 bg-black">
      <div className="px-4 md:px-12 lg:px-20 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl md:text-5xl">{country.flag}</span>
          {country.name}
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Explore movies and TV shows from {country.name}.
        </p>
      </div>

      <Suspense
        fallback={
          <>
            <FiltersSkeleton />
            <div className="px-4 md:px-12 lg:px-20 pt-8">
              <MediaGridSkeleton />
            </div>
          </>
        }
      >
        <CountryContent code={code} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
