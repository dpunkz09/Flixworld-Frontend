import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { getCompanyMovies, getCompanyTv, getCompanyDetails } from "@/lib/api";
import { extractId } from "@/lib/slug";
import MediaRow from "@/components/media-row";
import BackButton from "@/components/back-button";

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: CompanyPageProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const company = await getCompanyDetails(extractId(slug));
    return {
      title: company.name,
      description: `Movies and TV shows produced by ${company.name} on FlixWorld.`,
    };
  } catch {
    return { title: "Production Company — FlixWorld" };
  }
}

export default async function CompanyPage(props: CompanyPageProps) {
  const { slug } = await props.params;
  const id = extractId(slug);

  let company: Awaited<ReturnType<typeof getCompanyDetails>>;
  let movies: Awaited<ReturnType<typeof getCompanyMovies>>;
  let tv: Awaited<ReturnType<typeof getCompanyTv>>;

  try {
    [company, movies, tv] = await Promise.all([
      getCompanyDetails(id),
      getCompanyMovies(id),
      getCompanyTv(id),
    ]);
  } catch {
    notFound();
  }

  // Backend already returns a full logo_url (w300 size)
  const logoUrl = company.logo_url ?? null;
  const totalResults = movies.total_results + tv.total_results;

  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 py-6 md:py-10">
        <BackButton />

        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <div className="relative w-12 h-12">
                <Image src={logoUrl} alt={company.name} fill sizes="48px" className="object-contain" />
              </div>
            ) : (
              <Building2 className="w-6 h-6 text-zinc-500" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
              Production Company{company.origin_country ? ` · ${company.origin_country}` : ""}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{company.name}</h1>
            {totalResults > 0 && (
              <p className="text-sm text-zinc-400 mt-1">
                {totalResults.toLocaleString()} title{totalResults !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 -mx-4 md:-mx-12 lg:-mx-20">
          {movies.items.length > 0 && (
            <MediaRow title={`Movies by ${company.name}`} items={movies.items} />
          )}
          {tv.items.length > 0 && (
            <MediaRow title={`TV Shows by ${company.name}`} items={tv.items} />
          )}
        </div>

        {movies.items.length === 0 && tv.items.length === 0 && (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No titles found for this production company.
          </div>
        )}
      </div>
    </div>
  );
}
