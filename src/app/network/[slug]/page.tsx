import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Tv } from "lucide-react";
import { getNetworkDetails, getNetworkTv } from "@/lib/api";
import { extractId } from "@/lib/slug";
import MediaRow from "@/components/media-row";
import BackButton from "@/components/back-button";

interface NetworkPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: NetworkPageProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const network = await getNetworkDetails(extractId(slug));
    return {
      title: network.name,
      description: `TV shows from ${network.name} on FlixWorld.`,
    };
  } catch {
    return { title: "Network — FlixWorld" };
  }
}

export default async function NetworkPage(props: NetworkPageProps) {
  const { slug } = await props.params;
  const id = extractId(slug);

  let network: Awaited<ReturnType<typeof getNetworkDetails>>;
  let shows: Awaited<ReturnType<typeof getNetworkTv>>;

  try {
    [network, shows] = await Promise.all([
      getNetworkDetails(id),
      getNetworkTv(id),
    ]);
  } catch {
    notFound();
  }

  // Backend already returns a full logo_url
  const logoUrl = network.logo_url ?? null;

  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 py-6 md:py-10">
        <BackButton />

        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <div className="relative w-12 h-12">
                <Image
                  src={logoUrl}
                  alt={network.name}
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
            ) : (
              <Tv className="w-6 h-6 text-zinc-500" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
              Network{network.origin_country ? ` · ${network.origin_country}` : ""}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {network.name}
            </h1>
            {shows.total_results > 0 && (
              <p className="text-sm text-zinc-400 mt-1">
                {shows.total_results.toLocaleString()} show
                {shows.total_results !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <div className="-mx-4 md:-mx-12 lg:-mx-20">
          {shows.items.length > 0 ? (
            <MediaRow title={`Shows on ${network.name}`} items={shows.items} />
          ) : (
            <div className="py-16 text-center text-zinc-500 text-sm px-4">
              No titles found for this network.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
