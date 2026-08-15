import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline — FlixWorld",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 gap-6 text-center">
      <Image
        src="/assets/images/main-logo.png"
        alt="FlixWorld"
        width={160}
        height={46}
        className="h-10 w-auto object-contain mb-2"
      />
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-zinc-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">You are offline</h1>
        <p className="text-zinc-400 text-sm max-w-xs">
          Check your internet connection and try again. Pages you have visited
          recently may still be available.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
      >
        Try again
      </Link>
    </div>
  );
}
