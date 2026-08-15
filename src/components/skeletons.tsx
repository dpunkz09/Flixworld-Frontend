import { Skeleton } from "@/components/ui/skeleton";

export function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-8">
      {Array.from({ length: 28 }).map((_, i) => (
        <div key={i} className="w-full space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-lg bg-zinc-800" />
          <Skeleton className="h-4 w-4/5 bg-zinc-800" />
          <Skeleton className="h-3 w-1/3 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="sticky top-16 z-40 bg-black/90 border-b border-white/5 px-6 md:px-12 lg:px-20 py-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-32 bg-zinc-800 rounded-md" />
        <Skeleton className="h-8 w-24 bg-zinc-800 rounded-md" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 bg-zinc-800 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[85vh] min-h-[500px] bg-zinc-900 animate-pulse">
      <div className="h-full flex items-end pb-20 px-6 md:px-12 lg:px-20">
        <div className="space-y-4 max-w-2xl w-full">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full bg-zinc-700" />
            <Skeleton className="h-5 w-12 rounded-full bg-zinc-700" />
          </div>
          <Skeleton className="h-14 w-3/4 bg-zinc-700" />
          <Skeleton className="h-14 w-1/2 bg-zinc-700" />
          <Skeleton className="h-4 w-full bg-zinc-700" />
          <Skeleton className="h-4 w-5/6 bg-zinc-700" />
          <Skeleton className="h-4 w-4/6 bg-zinc-700" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-32 rounded-full bg-zinc-700" />
            <Skeleton className="h-11 w-32 rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MediaRowSkeleton({ title = "Loading..." }: { title?: string }) {
  return (
    <section className="py-2">
      <div className="px-6 md:px-12 lg:px-20 mb-4">
        <Skeleton className="h-7 w-48 bg-zinc-700" />
      </div>
      <div className="flex gap-3 px-6 md:px-12 lg:px-20 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-36 md:w-44 space-y-2">
            <Skeleton className="aspect-[2/3] w-full rounded-lg bg-zinc-700" />
            <Skeleton className="h-4 w-4/5 bg-zinc-700" />
            <Skeleton className="h-3 w-1/3 bg-zinc-700" />
          </div>
        ))}
      </div>
    </section>
  );
}
