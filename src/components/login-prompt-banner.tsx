"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const DISMISSED_KEY = "fw_login_banner_dismissed";

export default function LoginPromptBanner() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once auth resolves and user is logged out
    if (loading) return;
    if (user) return;
    // Check if dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    // Small delay so it doesn't flash during initial render
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [loading, user]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), 10_000);
    return () => clearTimeout(t);
  }, [visible]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-4 md:mx-8 lg:mx-12 mt-4 mb-2 animate-in slide-in-from-top-2 fade-in duration-300"
    >
      <div className="relative flex items-center gap-3 bg-gradient-to-r from-zinc-900 to-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 shadow-lg shadow-black/40 overflow-hidden">
        {/* Subtle red glow on left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 to-red-900 rounded-l-xl" />

        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-600/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-red-400" />
        </div>

        <p className="flex-1 text-sm text-zinc-300 leading-snug">
          <span className="font-semibold text-white">Get the full experience.</span>
          {" "}Sign in to resume watching, save your watchlist, get personalised recommendations, and join watch parties with friends.
        </p>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Link
            href="/login"
            onClick={dismiss}
            className="text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            Sign in free
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-md hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
