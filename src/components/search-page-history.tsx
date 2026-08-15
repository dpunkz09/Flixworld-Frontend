"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, TrendingUp, X, Search, Film, Tv } from "lucide-react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import type { MediaItem } from "@/types/api";

export default function SearchPageHistory() {
  const router = useRouter();
  const {
    keywords,
    recentItems,
    removeKeyword,
    clearKeywords,
    pushKeyword,
    pushItem,
    removeItem,
    clearItems,
  } = useSearchHistory();

  const goToSearch = (q: string) => {
    pushKeyword(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleItemClick = (item: MediaItem) => {
    pushItem(item);
    pushKeyword(item.title);
    router.push(`/search?q=${encodeURIComponent(item.title)}`);
  };

  const hasHistory = keywords.length > 0 || recentItems.length > 0;

  if (!hasHistory) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
          <Search className="w-7 h-7 text-zinc-500" />
        </div>
        <p className="text-zinc-400 font-medium">No search history yet</p>
        <p className="text-zinc-600 text-sm max-w-xs">
          Search for movies and TV shows using the search bar above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Recent keywords */}
      {keywords.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Recent Searches
            </h2>
            <button
              onClick={clearKeywords}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <div
                key={kw}
                className="group flex items-center gap-0 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-full transition-colors"
              >
                <button
                  onClick={() => goToSearch(kw)}
                  className="flex items-center gap-2 pl-3 pr-2 py-2 text-sm text-zinc-300 group-hover:text-white"
                >
                  <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  {kw}
                </button>
                <button
                  onClick={() => removeKeyword(kw)}
                  aria-label={`Remove "${kw}" from history`}
                  className="pr-3 py-2 text-zinc-600 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed items */}
      {recentItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              Recently Viewed
            </h2>
            <button
              onClick={clearItems}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4">
            {recentItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="group relative">
                <button
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 ring-1 ring-white/5 group-hover:ring-white/30 group-hover:scale-105 transition-all duration-200 shadow-lg">
                    {item.poster_url ? (
                      <Image
                        src={item.poster_url}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 30vw, (max-width: 1024px) 15vw, 10vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-600">
                        {item.type === "tv" ? (
                          <Tv className="w-6 h-6" />
                        ) : (
                          <Film className="w-6 h-6" />
                        )}
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-red-600/90 text-white px-1.5 py-0.5 rounded">
                        {item.type === "tv" ? "TV" : "Movie"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-400 group-hover:text-white line-clamp-2 leading-tight transition-colors">
                    {item.title}
                  </p>
                  {item.release_date && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {item.release_date.slice(0, 4)}
                    </p>
                  )}
                </button>
                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id, item.type)}
                  aria-label={`Remove ${item.title} from history`}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-700 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
