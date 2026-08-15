import MediaCard from "@/components/media-card";
import type { MediaItem } from "@/types/api";

interface DetailMediaRowProps {
  title: string;
  items: MediaItem[];
}

export default function DetailMediaRow({ title, items }: DetailMediaRowProps) {
  if (!items.length) return null;

  return (
    <section className="px-6 md:px-12 lg:px-20 py-8 border-t border-white/5">
      <h2 className="text-xl font-semibold text-white mb-5">{title}</h2>
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.slice(0, 20).map((item) => (
          <MediaCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}
