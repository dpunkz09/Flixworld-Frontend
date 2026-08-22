"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, MessageSquare, Flag, Star,
  Link2, Database, BarChart2, Search, LogOut,
  ChevronRight, Menu, X, Settings, Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/admin",                 label: "Dashboard",       icon: LayoutDashboard },
  { href: "/admin/users",           label: "Users",           icon: Users },
  { href: "/admin/comments",        label: "Comments",        icon: MessageSquare },
  { href: "/admin/reports",         label: "Reported Videos", icon: Flag },
  { href: "/admin/featured",        label: "Featured Movies", icon: Star },
  { href: "/admin/stream-urls",     label: "Stream URLs",     icon: Link2 },
  { href: "/admin/most-watched",    label: "Most Watched",    icon: BarChart2 },
  { href: "/admin/search-keywords", label: "Search Keywords", icon: Search },
  { href: "/admin/cache",           label: "Cache & TMDB",    icon: Database },
  { href: "/admin/download",        label: "Download Page",   icon: Download },
  { href: "/admin/settings",        label: "Settings",        icon: Settings },
];

function SidebarContent({
  pathname,
  user,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  user: { name: string; email: string };
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="text-red-500 font-bold text-lg">FlixWorld</span>
          <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5 font-semibold">
            ADMIN
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors group ${
                active
                  ? "bg-red-600/15 text-red-400 border-r-2 border-red-500"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-red-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors py-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (loading || !user?.is_admin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => logout().then(() => router.replace("/"));

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-zinc-900 border-r border-white/5 flex-col">
        <SidebarContent
          pathname={pathname}
          user={user}
          onNavigate={() => {}}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile: top bar */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-zinc-900 border-b border-white/5 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-base">FlixWorld</span>
            <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5 font-semibold">
              ADMIN
            </span>
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-zinc-900 border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        {/* Close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation menu"
          className="absolute top-3 right-3 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent
          pathname={pathname}
          user={user}
          onNavigate={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </aside>
    </div>
  );
}
