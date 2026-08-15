"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, LogOut, User as UserIcon, ChevronDown, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchOverlay from "@/components/search-overlay";
import { useAuth } from "@/hooks/useAuth";
import { resolveStorageUrl } from "@/lib/api";
import NotificationsPanel from "@/components/notifications-panel";
import { COUNTRIES } from "@/types/tmdb";
import { useSiteConfig } from "@/hooks/useSiteConfig";

// Defined outside component -- static, never causes render-time differences
// NAV_LINKS: all items; filtered at render time based on site config flags
const NAV_LINKS = [
  { label: "Home",        href: "/" },
  { label: "Movies",      href: "/movies" },
  { label: "TV Shows",    href: "/tv" },
  { label: "My List",     href: "/my-list" },
  { label: "Get App",     href: "/download" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const countriesRef = useRef<HTMLDivElement>(null);
  const { user, loading, logout } = useAuth();
  const { downloadPageEnabled } = useSiteConfig();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll while search overlay is open
  useEffect(() => {
    document.body.style.overflow = searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  // Close countries dropdown on outside click
  useEffect(() => {
    if (!countriesOpen) return;
    const handler = (e: MouseEvent) => {
      if (countriesRef.current && !countriesRef.current.contains(e.target as Node)) {
        setCountriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [countriesOpen]);

  const navLinks = NAV_LINKS.filter((l) => {
    if (l.href === "/download") return downloadPageEnabled !== false;
    return true;
  });

  async function handleLogout() {
    await logout();
    setUserMenuOpen(false);
    router.push("/");
  }

  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?";
  const avatarUrl = resolveStorageUrl(user?.profile_picture);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/95 backdrop-blur-md shadow-lg shadow-black/20"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12 lg:px-20 h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/assets/images/main-logo.png"
              alt="FlixWorld"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}

            {/* Countries dropdown */}
            <div className="relative" ref={countriesRef}>
              <button
                onClick={() => setCountriesOpen((v) => !v)}
                aria-expanded={countriesOpen}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                Countries
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    countriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {countriesOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 z-50 py-2 max-h-80 overflow-y-auto"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
                >
                  {COUNTRIES.map((country) => (
                    <Link
                      key={country.code}
                      href={`/country/${country.code.toLowerCase()}`}
                      onClick={() => setCountriesOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-lg leading-none">{country.flag}</span>
                      {country.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="text-zinc-300 hover:text-white hover:bg-white/10 rounded-full"
            >
              <Search className="w-5 h-5" />
            </Button>

            <NotificationsPanel />

            {/* Auth area -- desktop */}
            {!loading && (
              <div className="hidden md:block">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenuOpen((v) => !v);
                      }}
                      aria-label="User menu"
                      className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <span className="w-8 h-8 rounded-full overflow-hidden bg-red-600 flex items-center justify-center text-sm font-bold text-white">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          avatarInitial
                        )}
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl py-1 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-2 border-b border-white/10">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon className="w-4 h-4" />
                          Profile
                        </Link>
                        {user.is_admin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-300 hover:text-white"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 font-semibold"
                      >
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu toggle -- removed; bottom nav handles mobile navigation */}
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <Suspense>
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </Suspense>
    </>
  );
}
