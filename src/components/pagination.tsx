"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  if (totalPages <= 1) return null;

  // Build the page window: show up to 5 page buttons centered on currentPage
  const delta = 2;
  const range: number[] = [];
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);
  for (let i = start; i <= end; i++) range.push(i);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 py-10"
    >
      {/* First page */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="First page"
        disabled={currentPage === 1}
        onClick={() => goToPage(1)}
        className="text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-white/10"
      >
        <ChevronsLeft className="w-4 h-4" />
      </Button>

      {/* Prev page */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        className="text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-white/10"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Leading ellipsis */}
      {start > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(1)}
            className="w-9 h-9 text-sm text-zinc-400 hover:text-white hover:bg-white/10"
          >
            1
          </Button>
          {start > 2 && (
            <span className="text-zinc-600 px-1 text-sm">…</span>
          )}
        </>
      )}

      {/* Page number buttons */}
      {range.map((page) => (
        <Button
          key={page}
          variant="ghost"
          size="icon"
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          onClick={() => goToPage(page)}
          className={`w-9 h-9 text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-red-600 text-white hover:bg-red-700"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {page}
        </Button>
      ))}

      {/* Trailing ellipsis */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-zinc-600 px-1 text-sm">…</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(totalPages)}
            className="w-9 h-9 text-sm text-zinc-400 hover:text-white hover:bg-white/10"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next page */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-white/10"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Last page */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Last page"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(totalPages)}
        className="text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-white/10"
      >
        <ChevronsRight className="w-4 h-4" />
      </Button>
    </nav>
  );
}
