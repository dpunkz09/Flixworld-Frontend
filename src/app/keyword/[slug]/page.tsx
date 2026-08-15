import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { getKeywordMovies, getKeywordTv, getKeywordName } from "@/lib/api";
import { extractId } from "@/lib/slug";
import MediaRow from "@/components/media-row";
import BackButton from "@/components/back-button";

interface KeywordPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: KeywordPageProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const name = await getKeywordName(extractId(slug));
    return {
      title: name,
      description: `Movies and TV shows tagged with "${name}" on FlixWorld.`,
    };
  } catch {
    return { title: "Keyword — FlixWorld" };
  }
}

export default async function KeywordPage(props: KeywordPageProps) {
  const { slug } = await props.params;
  const id = extractId(slug);

  let name: string;
  let movies: Awaited<ReturnType<typeof getKeywordMovies>>;
  let tv: Awaited<ReturnType<typeof getKeywordTv>>;

  try {
    [name, movies, tv] = await Promise.all([
      getKeywordName(id),
      getKeywordMovies(id),
      getKeywordTv(id),
    ]);
  } catch {
    notFound();
  }

  const totalResults = movies.total_results + tv.total_results;

  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 py-6 md:py-10">
        <BackButton />

        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
              Keyword
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white capitalize">
              {name}
            </h1>
            {totalResults > 0 && (
              <p className="text-sm text-zinc-400 mt-1">
                {totalResults.toLocaleString()} title{totalResults !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 -mx-4 md:-mx-12 lg:-mx-20">
          {movies.items.length > 0 && (
            <MediaRow title={`Movies — ${name}`} items={movies.items} />
          )}
          {tv.items.length > 0 && (
            <MediaRow title={`TV Shows — ${name}`} items={tv.items} />
          )}
        </div>

        {movies.items.length === 0 && tv.items.length === 0 && (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No titles found for this keyword.
          </div>
        )}
      </div>
    </div>
  );
}
