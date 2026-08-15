import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { slugify } from "@/lib/slug";
import type { ExternalIds, ProductionCompany, Keyword, Network } from "@/types/detail";

interface DetailSidebarProps {
  facts: { label: string; value: string }[];
  externalIds: ExternalIds;
  productionCompanies: ProductionCompany[];
  keywords: Keyword[];
  networks?: Network[];
}

export default function DetailSidebar({
  facts,
  externalIds,
  productionCompanies,
  keywords,
  networks = [],
}: DetailSidebarProps) {
  const socials = [
    {
      key: "imdb",
      href: externalIds.imdb_id
        ? `https://www.imdb.com/title/${externalIds.imdb_id}`
        : null,
      label: "IMDb",
      icon: (
        <span className="text-[10px] font-black bg-yellow-400 text-black px-1 rounded leading-none py-0.5">
          IMDb
        </span>
      ),
    },
    {
      key: "facebook",
      href: externalIds.facebook_id
        ? `https://facebook.com/${externalIds.facebook_id}`
        : null,
      label: "Facebook",
      icon: (
        <span className="text-[10px] font-bold text-blue-400">f</span>
      ),
    },
    {
      key: "instagram",
      href: externalIds.instagram_id
        ? `https://instagram.com/${externalIds.instagram_id}`
        : null,
      label: "Instagram",
      icon: (
        <span className="text-[10px] font-bold bg-gradient-to-br from-pink-500 to-orange-400 text-white px-1 rounded leading-none py-0.5">
          IG
        </span>
      ),
    },
    {
      key: "twitter",
      href: externalIds.twitter_id
        ? `https://twitter.com/${externalIds.twitter_id}`
        : null,
      label: "X / Twitter",
      icon: (
        <span className="text-[10px] font-black text-white">X</span>
      ),
    },
  ].filter((s) => s.href);

  return (
    <aside className="space-y-8">
      {/* Social / external links */}
      {socials.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Links
          </h3>
          <div className="flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-full text-zinc-300 hover:text-white transition-colors text-xs"
              >
                {s.icon}
                {s.label}
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Facts */}
      {facts.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Details
          </h3>
          <dl className="space-y-3">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-zinc-500">{f.label}</dt>
                <dd className="text-sm text-white mt-0.5">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Networks — clickable (TV shows only) */}
      {networks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Networks
          </h3>
          <div className="flex flex-wrap gap-3">
            {networks.map((n) => (
              <Link
                key={n.id}
                href={`/network/${slugify(n.name, n.id)}`}
                className="group flex items-center gap-2 bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/5 hover:border-white/20 rounded-lg px-3 py-2 transition-colors"
              >
                {n.logo_url ? (
                  <div className="relative w-10 h-6 flex-shrink-0">
                    <Image
                      src={n.logo_url}
                      alt={n.name}
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>
                ) : null}
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">
                  {n.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Production companies — clickable */}
      {productionCompanies.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Production
          </h3>
          <div className="flex flex-wrap gap-3">
            {productionCompanies.map((c) => (
              <Link
                key={c.id}
                href={`/company/${slugify(c.name, c.id)}`}
                className="group flex items-center gap-2 bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/5 hover:border-white/20 rounded-lg px-3 py-2 transition-colors"
              >
                {c.logo_url ? (
                  <div className="relative w-10 h-6 flex-shrink-0">
                    <Image
                      src={c.logo_url}
                      alt={c.name}
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>
                ) : null}
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Keywords — clickable */}
      {keywords.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 20).map((k) => (
              <Link
                key={k.id}
                href={`/keyword/${slugify(k.name, k.id)}`}
                className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/8 hover:border-white/20 text-zinc-400 hover:text-white transition-colors"
              >
                {k.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
