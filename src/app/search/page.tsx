import { Suspense } from "react";
import type { Metadata } from "next";
import { searchMulti } from "@/lib/api";
import MediaGrid from "@/components/media-grid";
import Pagination from "@/components/pagination";
import SearchPageHistory from "@/components/search-page-history";
import { MediaGridSkeleton } from "@/components/skeletons";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(props: SearchPageProps): Promise<Metadata> {
  const { q } = await props.searchParams;
  return {
    title: q ? `"${q}" — FlixWorld Search` : "Search — FlixWorld",
    description: q ? `Search results for "${q}" on FlixWorld.` : "Search movies and TV shows on FlixWorld.",
  };
}

async function SearchResults({ query, page }: { query: string; page: number }) {
  const result = await searchMulti(query, page);

  if (!result.items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
        <p className="text-xl font-semibold text-white">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm text-zinc-500 max-w-sm">
          Try checking your spelling or using more general terms.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-zinc-500 mb-6">
        <span className="text-white font-semibold">
          {result.total_results.toLocaleString()}
        </span>{" "}
        results for{" "}
        <span className="text-white font-semibold">&ldquo;{query}&rdquo;</span>
      </p>
      <MediaGrid items={result.items} />
      <Suspense>
        <Pagination currentPage={result.page} totalPages={result.total_pages} />
      </Suspense>
    </>
  );
}

export default async function SearchPage(props: SearchPageProps) {
  const { q, page: pageStr } = await props.searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  return (
    <div className="min-h-screen pt-16 bg-black">
      <div className="px-6 md:px-12 lg:px-20 py-8">
        {query ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Results for{" "}
              <span className="text-zinc-400 font-normal">&ldquo;{query}&rdquo;</span>
            </h1>
            <Suspense fallback={<MediaGridSkeleton />}>
              <SearchResults query={query} page={page} />
            </Suspense>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Search</h1>
            <p className="text-zinc-500 text-sm mb-8">
              Your recent searches and viewed titles appear here.
            </p>
            {/* Client component — reads localStorage */}
            <SearchPageHistory />
          </>
        )}
      </div>
    </div>
  );
}
