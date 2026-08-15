"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminSearchKeywords, deleteAdminSearchKeyword, type SearchKeyword, type Paginated } from "@/lib/admin-api";

export default function AdminSearchKeywordsPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<Paginated<SearchKeyword> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminSearchKeywords(token, page)
      .then(setResult).catch(console.error).finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, query: string) => {
    if (!token || !confirm(`Delete keyword "${query}"?`)) return;
    setDeleting(id);
    try { await deleteAdminSearchKeyword(token, id); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setDeleting(null); }
  };

  const maxCount = result?.data.reduce((m, k) => Math.max(m, k.count), 1) ?? 1;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Search Keywords</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {result?.meta.total.toLocaleString()} unique queries tracked &middot; sorted by frequency
        </p>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-8">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Query</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Last Searched</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Results</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Searches</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="h-5 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))
            ) : result?.data.map((kw, idx) => {
              const rank = (page - 1) * 50 + idx + 1;
              const barPct = Math.max(4, (kw.count / maxCount) * 100);
              return (
                <tr key={kw.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-5 py-3 text-zinc-600 text-xs font-mono">{rank}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">{kw.query}</p>
                        <div className="mt-1.5 h-1 bg-zinc-800 rounded-full w-32 overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                    {new Date(kw.last_searched_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {kw.last_results != null
                      ? <span className="text-xs text-zinc-400">{kw.last_results.toLocaleString()}</span>
                      : <span className="text-zinc-600 text-xs">N/A</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                      <span className="font-bold text-white">{kw.count.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => handleDelete(kw.id, kw.query)} disabled={deleting === kw.id}
                      className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100">
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
