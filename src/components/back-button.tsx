"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  className?: string;
}

/**
 * Navigates to the previous page in the browser history.
 * Falls back to "/" if there's no history entry (e.g. direct link).
 */
export default function BackButton({
  label = "Back",
  className = "inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={className}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
