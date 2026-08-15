import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Tv, Film, Star, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About — FlixWorld",
  description: "Learn about FlixWorld — your free streaming destination for movies and TV shows.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/">
            <Image
              src="/assets/images/main-logo.png"
              alt="FlixWorld"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          About FlixWorld
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed mb-10">
          FlixWorld is a free streaming platform that brings you the latest movies and
          TV shows in one place — no subscriptions, no paywalls.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {[
            {
              icon: Film,
              title: "Thousands of Movies",
              desc: "From blockbusters to hidden gems, explore a constantly updated library.",
            },
            {
              icon: Tv,
              title: "TV Shows & Series",
              desc: "Binge full seasons of your favourite shows in HD quality.",
            },
            {
              icon: Star,
              title: "Curated Content",
              desc: "Top-rated, trending, and staff-picked titles surfaced every day.",
            },
            {
              icon: Globe,
              title: "Available Worldwide",
              desc: "Stream from any device, any browser, anywhere on the planet.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 p-5 rounded-xl bg-zinc-900/60 border border-white/8"
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-8">
          <p>
            FlixWorld uses movie and TV metadata provided by{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              The Movie Database (TMDB)
            </a>
            . We do not host, store, or distribute any video content directly.
          </p>
          <p>
            Have a question or want to get in touch?{" "}
            <Link href="/contact" className="text-red-400 hover:text-red-300 underline underline-offset-2">
              Contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
