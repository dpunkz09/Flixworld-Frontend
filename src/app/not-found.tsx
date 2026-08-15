import Link from "next/link";
import { Film, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
          <Film className="w-9 h-9 text-zinc-600" />
        </div>

        <div>
          <h1 className="text-5xl font-black text-white mb-2">404</h1>
          <p className="text-xl font-semibold text-zinc-200">Page Not Found</p>
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
            The title you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 rounded-full font-semibold px-6 py-2.5 text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 rounded-full px-6 py-2.5 text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Titles
          </Link>
        </div>
      </div>
    </div>
  );
}
