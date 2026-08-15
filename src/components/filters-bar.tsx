"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, CalendarDays, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TmdbGenre, SortOption } from "@/types/tmdb";

// Range of years to offer in the year selects
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const YEAR_OPTIONS: number[] = [];
for (let y = CURRENT_YEAR; y >= MIN_YEAR; y--) YEAR_OPTIONS.push(y);

interface FiltersBarProps {
  genres: TmdbGenre[];
  sortOptions: { value: SortOption; label: string }[];
  totalResults: number;
}

export default function FiltersBar({
  genres,
  sortOptions,
  totalResults,
}: FiltersBarProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get("sort") as SortOption) ?? "popularity.desc";
  const currentGenres = searchParams.get("genres") ?? "";
  const selectedGenreIds = currentGenres
    ? currentGenres.split(",").filter(Boolean)
    : [];
  const yearFrom = searchParams.get("year_from") ?? "";
  const yearTo = searchParams.get("year_to") ?? "";

  const hasFilters =
    selectedGenreIds.length > 0 ||
    currentSort !== "popularity.desc" ||
    yearFrom !== "" ||
    yearTo !== "";

  const createUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete("page");
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const handleSortChange = (value: SortOption) => {
    router.push(createUrl({ sort: value }), { scroll: false });
  };

  const toggleGenre = (genreId: string) => {
    const current = new Set(selectedGenreIds);
    if (current.has(genreId)) {
      current.delete(genreId);
    } else {
      current.add(genreId);
    }
    const next = Array.from(current).join(",");
    router.push(createUrl({ genres: next || null }), { scroll: false });
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  // Shared select style
  const selectCls =
    "text-sm bg-zinc-800 border border-white/10 text-white rounded-md px-2.5 py-1.5 cursor-pointer hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors";

  return (
    <div className="sticky top-16 z-40 bg-black/90 backdrop-blur-md border-b border-white/5">
      {/* ── Always-visible header row ── */}
      <div className="px-6 md:px-12 lg:px-20 py-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: results count + active badges */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 text-sm text-zinc-400 flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
            <span>
              <span className="text-white font-semibold">
                {totalResults.toLocaleString()}
              </span>{" "}
              results
            </span>
          </div>

          {/* Active filter pills — visible even when collapsed */}
          {(yearFrom || yearTo) && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 gap-1 cursor-pointer hover:bg-blue-600/30 flex-shrink-0"
              onClick={() =>
                router.push(
                  createUrl({ year_from: null, year_to: null }),
                  { scroll: false }
                )
              }
            >
              {yearFrom || "…"} – {yearTo || "…"}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {selectedGenreIds.map((id) => {
            const genre = genres.find((g) => String(g.id) === id);
            if (!genre) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 gap-1 cursor-pointer hover:bg-red-600/30 flex-shrink-0"
                onClick={() => toggleGenre(id)}
              >
                {genre.name}
                <X className="w-3 h-3" />
              </Badge>
            );
          })}
        </div>

        {/* Right: clear all + toggle button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 rounded-md px-2.5 py-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="filters-panel"
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-all duration-200 ${
              open
                ? "bg-red-600 border-red-600 text-white"
                : "bg-transparent border-white/15 text-zinc-300 hover:border-white/40 hover:text-white"
            }`}
          >
            Filters & Sort
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Collapsible panel ── */}
      {/*
        grid-rows transition trick: animates from 0fr → 1fr so no JS height
        measurement needed and it works correctly with dynamic content.
      */}
      <div
        id="filters-panel"
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 md:px-12 lg:px-20 pb-5 pt-1 flex flex-col gap-5">
            {/* Sort + Year range row */}
            <div className="flex items-center flex-wrap gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-select"
                  className="text-xs text-zinc-400 whitespace-nowrap"
                >
                  Sort by
                </label>
                <select
                  id="sort-select"
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className={selectCls}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-5 w-px bg-white/10" />

              {/* Year range */}
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <label htmlFor="year-from" className="sr-only">
                  From year
                </label>
                <select
                  id="year-from"
                  value={yearFrom}
                  onChange={(e) =>
                    router.push(
                      createUrl({ year_from: e.target.value || null }),
                      { scroll: false }
                    )
                  }
                  className={selectCls}
                >
                  <option value="">From</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <span className="text-zinc-600 text-xs">–</span>

                <label htmlFor="year-to" className="sr-only">
                  To year
                </label>
                <select
                  id="year-to"
                  value={yearTo}
                  onChange={(e) =>
                    router.push(
                      createUrl({ year_to: e.target.value || null }),
                      { scroll: false }
                    )
                  }
                  className={selectCls}
                >
                  <option value="">To</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Genre pills */}
            <div>
              <p className="text-xs text-zinc-500 mb-2.5 uppercase tracking-wider font-medium">
                Genres
              </p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const isSelected = selectedGenreIds.includes(String(genre.id));
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(String(genre.id))}
                      aria-pressed={isSelected}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
                        isSelected
                          ? "bg-red-600 border-red-600 text-white"
                          : "bg-transparent border-white/15 text-zinc-300 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
