"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MediaCard from "@/components/media-card";
import type { MediaItem } from "@/types/api";

interface MediaRowProps {
  title: string;
  items: MediaItem[];
}

export default function MediaRow({ title, items }: MediaRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  if (!items.length) return null;

  const scroll = useCallback((direction: "left" | "right") => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  return (
    <section className="relative group/row py-2">
      <h2 className="text-base md:text-xl font-semibold text-white mb-3 md:mb-4 px-4 md:px-12 lg:px-20">
        {title}
      </h2>

      <div className="relative">
        {/* Left scroll button — visible on md+, or when scrolled on mobile */}
        {showLeft && (
          <button
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 md:w-16 flex items-center justify-center bg-gradient-to-r from-black/90 to-transparent text-white md:opacity-0 md:group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-12 lg:px-20 pb-3 md:pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>

        {/* Right scroll button */}
        {showRight && (
          <button
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 md:w-16 flex items-center justify-center bg-gradient-to-l from-black/90 to-transparent text-white md:opacity-0 md:group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}
      </div>
    </section>
  );
}
