import type { Metadata } from "next";
import Link from "next/link";
import { Globe } from "lucide-react";
import { COUNTRIES } from "@/types/tmdb";

export const metadata: Metadata = {
  title: "Browse by Country — FlixWorld",
  description: "Explore movies and TV shows from countries around the world on FlixWorld.",
};

export default function CountriesIndexPage() {
  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20 pb-24 md:pb-8">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 py-8 md:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Countries</h1>
            <p className="text-zinc-400 text-sm mt-0.5">
              Discover movies and TV shows by origin country.
            </p>
          </div>
        </div>

        {/* Country grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {COUNTRIES.map((country) => (
            <Link
              key={country.code}
              href={`/country/${country.code.toLowerCase()}`}
              className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-zinc-900/60 border border-white/8 hover:border-white/20 hover:bg-zinc-800/60 transition-all duration-200"
            >
              <span className="text-4xl leading-none">{country.flag}</span>
              <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors text-center leading-tight">
                {country.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
