"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Info, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/slug";
import type { MediaItem } from "@/types/api";

interface HeroCarouselProps {
  items: MediaItem[];
}

function getRating(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "N/A" : num.toFixed(1);
}

function getYear(dateStr: string): string {
  return dateStr?.slice(0, 4) ?? "";
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Track the transition timeout so we can cancel it on unmount
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable goTo that doesn't re-create when isTransitioning changes -
  // read the latest value through a ref instead.
  const isTransitioningRef = useRef(false);
  isTransitioningRef.current = isTransitioning;

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioningRef.current) return;
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      setIsTransitioning(true);
      setCurrent(index);
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        transitionTimerRef.current = null;
      }, 500);
    },
    [] // stable - reads state via refs
  );

  const itemsLengthRef = useRef(items.length);
  itemsLengthRef.current = items.length;
  const currentRef = useRef(current);
  currentRef.current = current;

  const prev = useCallback(() => {
    goTo((currentRef.current - 1 + itemsLengthRef.current) % itemsLengthRef.current);
  }, [goTo]);

  const next = useCallback(() => {
    goTo((currentRef.current + 1) % itemsLengthRef.current);
  }, [goTo]);

  // Auto-advance every 6 seconds - stable `next` means this never restarts
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  // Cleanup transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  if (!items.length) return null;

  const item = items[current];

  return (
    <section className="relative w-full h-[60vh] md:h-[85vh] min-h-[380px] overflow-hidden bg-black">
      {/* Backdrop */}
      {item.backdrop_url && (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <img
            src={item.backdrop_url}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
            fetchPriority="high"
          />
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex items-end pb-14 md:pb-20 px-4 md:px-12 lg:px-20">
        <div
          className={`max-w-2xl space-y-2 md:space-y-4 transition-all duration-500 ${
            isTransitioning
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
        >
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="uppercase text-xs font-semibold tracking-wider bg-red-600 text-white border-0 hover:bg-red-700"
            >
              {item.type === "tv" ? "TV Series" : "Movie"}
            </Badge>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-yellow-400" />
              <span className="text-sm font-semibold text-white">
                {getRating(item.vote_average)}
              </span>
            </div>
            <span className="text-sm text-zinc-400">{getYear(item.release_date)}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-tight line-clamp-2 md:line-clamp-none">
            {item.title}
          </h1>

          {/* Overview - hidden on small mobile */}
          {item.overview && (
            <p className="hidden sm:block text-sm md:text-base text-zinc-300 leading-relaxed line-clamp-2 md:line-clamp-3 max-w-xl">
              {item.overview}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3 pt-1 md:pt-2">
            <Button
              size="sm"
              nativeButton={false}
              className="gap-1.5 md:gap-2 bg-white text-black font-semibold hover:bg-zinc-200 rounded-full px-4 md:px-6 h-9 md:h-11 text-sm"
              render={
                <a
                  href={
                    item.type === "movie"
                      ? `/watch/movie/${slugify(item.title, item.id)}`
                      : `/watch/tv/${slugify(item.title, item.id)}`
                  }
                />
              }
            >
              <Play className="w-4 h-4 fill-black" />
              Play
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              variant="outline"
              className="gap-1.5 md:gap-2 border-white/40 text-white hover:bg-white/10 rounded-full px-4 md:px-6 h-9 md:h-11 text-sm backdrop-blur-sm"
              render={
                <a
                  href={
                    item.type === "movie"
                      ? `/movies/${slugify(item.title, item.id)}`
                      : `/tv/${slugify(item.title, item.id)}`
                  }
                />
              }
            >
              <Info className="w-4 h-4" />
              Info
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation arrows - desktop only */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 border border-white/20 items-center justify-center text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 border border-white/20 items-center justify-center text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot indicators - larger tap targets on mobile */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full p-1.5 md:p-0 -m-1.5 md:m-0 flex items-center justify-center`}
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 md:w-6 h-1.5 md:h-2 bg-white"
                  : "w-1.5 md:w-2 h-1.5 md:h-2 bg-white/40"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
