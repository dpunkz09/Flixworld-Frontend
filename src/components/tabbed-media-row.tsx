"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaRow from "@/components/media-row";
import type { MediaSection } from "@/types/api";

interface TabbedMediaRowProps {
  section: MediaSection;
}

export default function TabbedMediaRow({ section }: TabbedMediaRowProps) {
  const hasMovies = section.movies.length > 0;
  const hasTv = section.tv.length > 0;

  if (!hasMovies && !hasTv) return null;

  // If only one type, skip the tabs
  if (!hasMovies) return <MediaRow title={section.title} items={section.tv} />;
  if (!hasTv) return <MediaRow title={section.title} items={section.movies} />;

  return (
    <section className="py-2">
      <div className="px-4 md:px-12 lg:px-20 mb-3 md:mb-4 flex items-center gap-4">
        <h2 className="text-base md:text-xl font-semibold text-white">
          {section.title}
        </h2>
      </div>
      <Tabs defaultValue="movies">
        <div className="px-4 md:px-12 lg:px-20 mb-3 md:mb-4">
          <TabsList className="bg-zinc-800/60 border border-white/10 backdrop-blur-sm">
            <TabsTrigger
              value="movies"
              className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-red-600 rounded-sm text-sm font-medium px-4 h-8"
            >
              Movies
            </TabsTrigger>
            <TabsTrigger
              value="tv"
              className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-red-600 rounded-sm text-sm font-medium px-4 h-8"
            >
              TV Shows
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="movies" className="mt-0">
          <MediaRow title="" items={section.movies} />
        </TabsContent>
        <TabsContent value="tv" className="mt-0">
          <MediaRow title="" items={section.tv} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
