import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { slugify } from "@/lib/slug";
import type { CastMember } from "@/types/detail";

export default function CastRow({ cast }: { cast: CastMember[] }) {
  if (!cast.length) return null;
  const visible = cast.slice(0, 15);

  return (
    <section className="px-4 md:px-12 lg:px-20 py-8 border-t border-white/5">
      <h2 className="text-xl font-semibold text-white mb-5">Cast</h2>
      <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {visible.map((member) => (
          <Link
            key={member.id}
            href={`/person/${slugify(member.name, member.id)}`}
            className="flex-shrink-0 w-24 text-center group"
          >
            <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden bg-zinc-800 ring-2 ring-white/5 group-hover:ring-red-500/60 transition-all duration-300 group-hover:scale-105">
              {member.profile_url ? (
                <Image
                  src={member.profile_url}
                  alt={member.name}
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                  <User className="w-7 h-7" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
              {member.name}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-2 leading-tight">
              {member.character}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
