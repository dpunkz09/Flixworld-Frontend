"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, X, Trash2, ToggleLeft, ToggleRight, GripVertical, Star, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdminFeatured,
  searchFeaturedCandidates,
  addAdminFeatured,
  updateAdminFeatured,
  deleteAdminFeatured,
  reorderAdminFeatured,
  type FeaturedItem,
  type TmdbSearchResult,
} from "@/lib/admin-api";

const POSTER = "https://image.tmdb.org/t/p/w185";

// -- Search panel -------------------------------------------------------------

function SearchPanel({
  token,
  existingIds,
  onAdded,
}: {
  token: string;
  existingIds: Set<number>;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "movie" | "tv">("all");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(
    (q: string, t: "all" | "movie" | "tv") => {
      if (!q.trim()) { setResults([]); return; }
      setSearching(true);
      searchFeaturedCandidates(token, q, t)
        .then(setResults)
        .catch(console.error)
        .finally(() => setSearching(false));
    },
    [token],
  );

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val, type), 400);
  };

  const handleTypeChange = (t: "all" | "movie" | "tv") => {
    setType(t);
    if (query.trim()) runSearch(query, t);
  };

  const handleAdd = async (result: TmdbSearchResult) => {
    setAddingId(result.tmdb_id);
    try {
      await addAdminFeatured(token, {
        type: result.type,
        tmdb_id: result.tmdb_id,
        title: result.title ?? undefined,
        poster_path: result.poster_path ?? undefined,
        backdrop_path: result.backdrop_path ?? undefined,
        vote_average: result.vote_average ?? undefined,
        release_date: result.release_date ?? undefined,
        overview: result.overview ?? undefined,
        sort_order: 0,
      });
      onAdded();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAddingId(null);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search movies or TV shows..."
            className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex rounded-lg overflow-hidden border border-white/10 text-sm">
          {(["all", "movie", "tv"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2.5 capitalize transition-colors ${
                type === t
                  ? "bg-red-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results grid */}
      {searching && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {results.map((r) => {
            const alreadyAdded = existingIds.has(r.tmdb_id);
            const isAdding = addingId === r.tmdb_id;
            const year = r.release_date ? r.release_date.slice(0, 4) : null;
            const rating = r.vote_average ? r.vote_average.toFixed(1) : null;

            return (
              <button
                key={`${r.type}-${r.tmdb_id}`}
                onClick={() => !alreadyAdded && handleAdd(r)}
                disabled={alreadyAdded || isAdding}
                title={alreadyAdded ? "Already in featured list" : `Add "${r.title}"`}
                className={[
                  "group relative rounded-xl overflow-hidden text-left transition-all",
                  alreadyAdded
                    ? "opacity-40 cursor-not-allowed ring-2 ring-green-500/50"
                    : "cursor-pointer hover:ring-2 hover:ring-red-500 hover:scale-[1.02]",
                  isAdding ? "opacity-60" : "",
                ].join(" ")}
              >
                {/* Poster */}
                <div className="aspect-[2/3] bg-zinc-800">
                  {r.poster_path ? (
                    <img
                      src={`${POSTER}${r.poster_path}`}
                      alt={r.title ?? ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs px-2 text-center">
                      No image
                    </div>
                  )}
                </div>

                {/* Overlay on hover */}
                {!alreadyAdded && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isAdding ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-8 h-8 text-white" />
                    )}
                  </div>
                )}

                {/* Already added badge */}
                {alreadyAdded && (
                  <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                )}

                {/* Type badge */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-xs bg-black/70 text-zinc-300 rounded px-1.5 py-0.5 capitalize">
                    {r.type}
                  </span>
                </div>

                {/* Info footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-6">
                  <p className="text-xs font-medium text-white leading-tight line-clamp-2">
                    {r.title ?? "Unknown"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {year && <span className="text-xs text-zinc-400">{year}</span>}
                    {rating && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                        <Star className="w-2.5 h-2.5 fill-yellow-400" />
                        {rating}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-sm text-zinc-500 py-4">No results for &quot;{query}&quot;.</p>
      )}
    </div>
  );
}

// -- Sortable Row -------------------------------------------------------------

function SortableRow({
  item,
  actionId,
  onToggle,
  onDelete,
}: {
  item: FeaturedItem;
  actionId: number | null;
  onToggle: (item: FeaturedItem) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  const year = item.release_date ? item.release_date.slice(0, 4) : null;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "bg-zinc-900 border rounded-xl p-3 flex items-center gap-3",
        item.active ? "border-white/5" : "border-white/5 opacity-60",
        isDragging ? "shadow-xl shadow-black/50 bg-zinc-800" : "",
      ].join(" ")}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 flex-shrink-0 touch-none p-1"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Poster thumbnail */}
      {item.poster_path ? (
        <img
          src={`${POSTER}${item.poster_path}`}
          alt={item.title ?? ""}
          className="w-9 h-14 object-cover rounded flex-shrink-0 bg-zinc-800"
        />
      ) : (
        <div className="w-9 h-14 rounded flex-shrink-0 bg-zinc-800" />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-zinc-800 text-zinc-400 rounded px-1.5 py-0.5 capitalize">
            {item.type}
          </span>
          {year && <span className="text-xs text-zinc-500">{year}</span>}
          {rating && (
            <span className="flex items-center gap-0.5 text-xs text-yellow-400">
              <Star className="w-2.5 h-2.5 fill-yellow-400" />
              {rating}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-white mt-0.5 truncate">
          {item.title ?? `TMDB ${item.tmdb_id}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(item)}
          disabled={actionId === item.id}
          title={item.active ? "Deactivate" : "Activate"}
          className={
            item.active
              ? "transition-colors disabled:opacity-40 text-green-400 hover:text-zinc-400"
              : "transition-colors disabled:opacity-40 text-zinc-600 hover:text-green-400"
          }
        >
          {item.active ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={actionId === item.id}
          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// -- Page ---------------------------------------------------------------------

export default function AdminFeaturedPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminFeatured(token)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !token) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const payload = reordered.map((item, idx) => ({ id: item.id, sort_order: idx }));
    setSaving(true);
    try {
      await reorderAdminFeatured(token, payload);
      setItems((prev) => prev.map((item, idx) => ({ ...item, sort_order: idx })));
    } catch (e) {
      alert((e as Error).message);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: FeaturedItem) => {
    if (!token) return;
    setActionId(item.id);
    try {
      await updateAdminFeatured(token, item.id, { active: !item.active });
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Remove this featured item?")) return;
    setActionId(id);
    try {
      await deleteAdminFeatured(token, id);
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionId(null);
    }
  };

  const existingIds = new Set(items.map((i) => i.tmdb_id));
  const itemCount = items.length;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Featured Items</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage homepage hero carousel - {itemCount} {itemCount !== 1 ? "items" : "item"}
          {saving && <span className="ml-2 text-zinc-600 animate-pulse">Saving order...</span>}
        </p>
      </div>

      {/* Search to add */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-2">
        <p className="text-sm font-semibold text-white">Add to Featured</p>
        <p className="text-xs text-zinc-500">Search for a movie or TV show, then click a result to add it.</p>
        {token && (
          <SearchPanel token={token} existingIds={existingIds} onAdded={load} />
        )}
      </div>

      {/* Current list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Current Order</p>
          {itemCount > 1 && (
            <p className="text-xs text-zinc-600">Drag to reorder</p>
          )}
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
          ))
        ) : itemCount === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm bg-zinc-900 border border-white/5 rounded-xl">
            No featured items yet. Search for one above.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  actionId={actionId}
                  onToggle={toggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
