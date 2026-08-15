"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, ChevronLeft, ChevronRight, Film, Tv, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminMostWatched, deleteAdminMostWatched, type MostWatchedItem, type Paginated } from "@/lib/admin-api";

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";

export default function AdminMostWatchedPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<Paginated<MostWatchedItem> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminMostWatched(token, page)
      .then(setResult).catch(console.error).finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, title: string | null) => {
    if (!token || !confirm(`Delete "${title ?? "this record"}" from most watched?`)) return;
    setDeleting(id);
    try { await deleteAdminMostWatched(token, id); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Most Watched</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{result?.meta.total.toLocaleString()} tracked titles</p>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-8">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Rating</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Year</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Watches</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-5 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))
            ) : result?.data.map((item, idx) => {
              const rank = (page - 1) * 50 + idx + 1;
              return (
                <tr key={item.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3 text-zinc-600 text-xs font-mono">{rank}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {item.poster_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${TMDB_IMG}${item.poster_path}`} alt={item.title ?? ""} className="w-8 h-12 object-cover rounded flex-shrink-0 bg-zinc-800" />
                      ) : (
                        <div className="w-8 h-12 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          {item.type === "tv" ? <Tv className="w-3.5 h-3.5 text-zinc-600" /> : <Film className="w-3.5 h-3.5 text-zinc-600" />}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white text-sm">{item.title ?? `TMDB ${item.tmdb_id}`}</p>
                        <p className="text-xs text-zinc-600">ID: {item.tmdb_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-xs bg-zinc-800 text-zinc-400 rounded px-1.5 py-0.5 capitalize">{item.type}</span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {item.vote_average != null && item.vote_average > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {item.vote_average.toFixed(1)}
                      </span>
                    ) : <span className="text-zinc-600 text-xs">N/A</span>}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 text-xs hidden lg:table-cell">{item.release_year ?? "N/A"}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-bold text-white">{item.watch_count.toLocaleString()}</span>
                    <span className="text-zinc-500 text-xs ml-1">x</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(item.id, item.title)} disabled={deleting === item.id}
                      className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {result && result.meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Page {page} of {result.meta.last_page}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage((p) => Math.min(result.meta.last_page, p + 1))} disabled={page === result.meta.last_page} className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
