"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminComments, deleteAdminComment, type AdminComment, type Paginated } from "@/lib/admin-api";

export default function AdminCommentsPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<Paginated<AdminComment> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminComments(token, page, query || undefined)
      .then(setResult).catch(console.error).finally(() => setLoading(false));
  }, [token, page, query]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete this comment?")) return;
    setDeleting(id);
    try { await deleteAdminComment(token, id); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setDeleting(null); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setQuery(search); setPage(1); };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Comments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{result?.meta.total.toLocaleString()} total</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search body..."
              className="pl-9 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 w-full sm:w-64" />
          </div>
          <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0">Search</button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Comment</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Media</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="h-5 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))
            ) : result?.data.map((c) => (
              <tr key={c.id} className="hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 max-w-xs">
                  <p className="text-white text-sm line-clamp-2">{c.body}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">by <span className="text-zinc-400">{c.user.name}</span></p>
                  {c.parent_id && <span className="text-[10px] text-zinc-600">Reply</span>}
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <a href={`/${c.type === "movie" ? "movies" : "tv"}/${c.tmdb_id}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                    <span className="capitalize">{c.type}</span> #{c.tmdb_id}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-5 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
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
