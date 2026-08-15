import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { getPersonDetails, getPersonCredits } from "@/lib/api";
import { extractId } from "@/lib/slug";
import MediaRow from "@/components/media-row";
import BackButton from "@/components/back-button";

interface PersonPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PersonPageProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const person = await getPersonDetails(extractId(slug));
    return {
      title: person.name,
      description: person.biography?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: "Person — FlixWorld" };
  }
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PersonPage(props: PersonPageProps) {
  const { slug } = await props.params;
  const id = extractId(slug);

  let person;
  let credits;
  try {
    [person, credits] = await Promise.all([
      getPersonDetails(id),
      getPersonCredits(id),
    ]);
  } catch {
    notFound();
  }

  const avatar = person.profile_url ?? null;
  const age = person.birthday
    ? Math.floor(
        (new Date(person.deathday ?? Date.now()).getTime() -
          new Date(person.birthday).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="min-h-screen bg-black pt-16 md:pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 py-6 md:py-10">
        <BackButton />

        <div className="flex flex-col sm:flex-row gap-6 md:gap-10 mb-10">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="relative w-36 h-48 sm:w-44 sm:h-60 rounded-2xl overflow-hidden bg-zinc-800 ring-1 ring-white/10 shadow-2xl shadow-black/60">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={person.name}
                  fill
                  sizes="(max-width: 640px) 144px, 176px"
                  className="object-cover object-top"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                  <span className="text-5xl font-bold text-zinc-700">
                    {person.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
                {person.known_for_department}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {person.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
              {person.birthday && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                  {formatDate(person.birthday)}
                  {age != null && !person.deathday && (
                    <span className="text-zinc-500">({age} years old)</span>
                  )}
                  {person.deathday && (
                    <span className="text-zinc-500">
                      — {formatDate(person.deathday)} (aged {age})
                    </span>
                  )}
                </span>
              )}
              {person.place_of_birth && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                  {person.place_of_birth}
                </span>
              )}
            </div>

            <a
              href={`https://www.themoviedb.org/person/${person.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              View on TMDB
            </a>

            {person.biography && (
              <div className="space-y-1.5">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Biography
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl line-clamp-6 md:line-clamp-none">
                  {person.biography}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 -mx-4 md:-mx-12 lg:-mx-20">
          {credits.movies.length > 0 && (
            <MediaRow title={`Movies with ${person.name}`} items={credits.movies} />
          )}
          {credits.tv.length > 0 && (
            <MediaRow title={`TV Shows with ${person.name}`} items={credits.tv} />
          )}
        </div>

        {credits.movies.length === 0 && credits.tv.length === 0 && (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No credits found for {person.name}.
          </div>
        )}
      </div>
    </div>
  );
}
