"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Clock, TrendingUp, Star, Film, Tv, ArrowRight } from "lucide-react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import type { MediaItem } from "@/types/api";

// Lightweight client-side fetch wrapper — hits a route handler so the API key
// stays server-side
async function fetchSuggestions(query: string, signal: AbortSignal): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&page=1`,
    { signal }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).slice(0, 8) as MediaItem[];
}

function getRating(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "N/A" : num.toFixed(1);
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const {
    keywords,
    recentItems,
    pushKeyword,
    removeKeyword,
    clearKeywords,
    pushItem,
    removeItem,
    clearItems,
  } = useSearchHistory();

  // Focus input when overlay opens
  useEffect(() => {
    if (open) {
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSuggestions([]);
    }
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced live suggestions with fetch abortion on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Abort any in-flight fetch from the previous query
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      fetchSuggestions(query, controller.signal)
        .then((results) => {
          startTransition(() => {
            setSuggestions(results);
            setLoading(false);
          });
        })
        .catch((err: unknown) => {
          // Ignore abort errors — they're expected on rapid typing
          if (err instanceof Error && err.name === "AbortError") return;
          setLoading(false);
        })
        .finally(() => {
          if (abortRef.current === controller) abortRef.current = null;
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [query]);

  const commit = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      pushKeyword(trimmed);
      onClose();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [pushKeyword, onClose, router]
  );

  const handleItemClick = useCallback(
    (item: MediaItem) => {
      pushItem(item);
      pushKeyword(item.title);
      onClose();
      // Navigate to detail page in future; for now go to search
      router.push(`/search?q=${encodeURIComponent(item.title)}`);
    },
    [pushItem, pushKeyword, onClose, router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commit(query);
  };

  if (!open) return null;

  const showSuggestions = query.trim().length > 0;
  const showHistory = !showSuggestions && (keywords.length > 0 || recentItems.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-white/10 shadow-2xl shadow-black/50"
      >
        {/* Search input row */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-6 md:px-12 lg:px-20 h-16 border-b border-white/5"
        >
          <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows…"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-white text-lg placeholder:text-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="text-zinc-400 hover:text-white transition-colors ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results panel */}
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-6 md:px-12 lg:px-20 py-4">
          {/* ── Live suggestions ── */}
          {showSuggestions && (
            <div className="space-y-1">
              {loading && (
                <div className="flex items-center gap-2 py-3 text-zinc-500 text-sm">
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                  Searching…
                </div>
              )}

              {!loading && suggestions.length === 0 && (
                <p className="py-6 text-center text-zinc-500 text-sm">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {suggestions.map((item) => (
                <SuggestionRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onClick={() => handleItemClick(item)}
                />
              ))}

              {suggestions.length > 0 && (
                <button
                  onClick={() => commit(query)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 mt-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
                >
                  <span>
                    See all results for{" "}
                    <span className="text-white font-medium">&ldquo;{query}&rdquo;</span>
                  </span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </button>
              )}
            </div>
          )}

          {/* ── History (shown when input is empty) ── */}
          {showHistory && (
            <div className="space-y-6 pb-4">
              {/* Recent keywords */}
              {keywords.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Recent searches
                    </h3>
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
                        className="group flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-full transition-colors"
                      >
                        <button
                          onClick={() => commit(kw)}
                          className="pl-3 pr-1 py-1.5 text-sm text-zinc-300 group-hover:text-white"
                        >
                          {kw}
                        </button>
                        <button
                          onClick={() => removeKeyword(kw)}
                          aria-label={`Remove ${kw}`}
                          className="pr-2 py-1.5 text-zinc-500 hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recently viewed items */}
              {recentItems.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Recently viewed
                    </h3>
                    <button
                      onClick={clearItems}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {recentItems.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="group relative">
                        <button
                          onClick={() => handleItemClick(item)}
                          className="w-full text-left"
                        >
                          <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-zinc-800 ring-1 ring-white/5 group-hover:ring-white/30 transition-all">
                            {item.poster_url ? (
                              <Image
                                src={item.poster_url}
                                alt={item.title}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                                {item.type === "tv" ? (
                                  <Tv className="w-6 h-6" />
                                ) : (
                                  <Film className="w-6 h-6" />
                                )}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-zinc-400 group-hover:text-white line-clamp-2 leading-tight transition-colors">
                            {item.title}
                          </p>
                        </button>
                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(item.id, item.type)}
                          aria-label={`Remove ${item.title}`}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Empty state when no history and no query */}
          {!showSuggestions && !showHistory && (
            <div className="py-10 text-center text-zinc-600 text-sm">
              Start typing to search for movies and TV shows
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SuggestionRow({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
    >
      {/* Poster thumbnail */}
      <div className="relative w-9 h-14 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={item.title}
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
            {item.type === "tv" ? (
              <Tv className="w-4 h-4" />
            ) : (
              <Film className="w-4 h-4" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white group-hover:text-zinc-100 truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
            {item.type === "tv" ? "TV" : "Movie"}
          </span>
          {item.release_date && (
            <span className="text-xs text-zinc-500">
              {item.release_date.slice(0, 4)}
            </span>
          )}
          {Number(item.vote_average) > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-zinc-400">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {getRating(item.vote_average)}
            </span>
          )}
        </div>
      </div>

      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
    </button>
  );
}
