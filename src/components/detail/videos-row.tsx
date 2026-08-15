"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import type { Video } from "@/types/detail";

export default function VideosRow({ videos }: { videos: Video[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Prioritise: Trailer → Teaser → Clip → rest
  const priority = ["Trailer", "Teaser", "Clip"];
  const sorted = [...videos].sort(
    (a, b) => priority.indexOf(a.type) - priority.indexOf(b.type)
  );
  const visible = sorted.slice(0, 8);
  if (!visible.length) return null;

  return (
    <section className="px-6 md:px-12 lg:px-20 py-8 border-t border-white/5">
      <h2 className="text-xl font-semibold text-white mb-5">Videos</h2>

      <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {visible.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveKey(v.key)}
            className="group flex-shrink-0 w-56 md:w-64 text-left"
            aria-label={`Play ${v.name}`}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800 ring-1 ring-white/5 group-hover:ring-white/30 transition-all">
              <Image
                src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                alt={v.name}
                fill
                sizes="256px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
            <p className="mt-1.5 text-xs font-medium text-zinc-300 line-clamp-2 group-hover:text-white transition-colors">
              {v.name}
            </p>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
              {v.type}
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {activeKey && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveKey(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${activeKey}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Video player"
            />
          </div>
          <button
            onClick={() => setActiveKey(null)}
            aria-label="Close video"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
