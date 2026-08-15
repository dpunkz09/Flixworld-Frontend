import MediaCard from "@/components/media-card";
import type { MediaItem } from "@/types/api";

interface MediaGridProps {
  items: MediaItem[];
}

export default function MediaGrid({ items }: MediaGridProps) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-8">
      {items.map((item, index) => (
        <div key={`${item.type}-${item.id}`} className="w-full">
          <MediaCard item={item} gridMode priority={index === 0} />
        </div>
      ))}
    </div>
  );
}
