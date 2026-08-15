"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Tv, User, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const BASE_TABS = [
  { label: "Home",      href: "/",        icon: Home  },
  { label: "Movies",    href: "/movies",  icon: Film  },
  { label: "TV",        href: "/tv",      icon: Tv    },
  { label: "Countries", href: "/country", icon: Globe },
];

const PROFILE_TAB = { label: "Profile", href: "/profile", icon: User };

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const profileTab = user
    ? PROFILE_TAB
    : { ...PROFILE_TAB, label: "Sign In", href: "/login" };

  const allTabs = [...BASE_TABS, profileTab];

  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-14">
        {allTabs.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-h-[44px] ${
                active
                  ? "text-red-500"
                  : "text-zinc-500 hover:text-zinc-300 active:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`w-5 h-5 ${active ? "stroke-red-500" : ""}`}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
