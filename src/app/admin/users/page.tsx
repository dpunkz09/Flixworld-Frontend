"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldOff, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminUsers, updateAdminUser, deleteAdminUser, type AdminUser, type Paginated } from "@/lib/admin-api";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<Paginated<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminUsers(token, page, query || undefined)
      .then(setResult).catch(console.error).finally(() => setLoading(false));
  }, [token, page, query]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setQuery(search); setPage(1); };

  const toggleAdmin = async (u: AdminUser) => {
    if (!token) return;
    setActionId(u.id);
    try { await updateAdminUser(token, u.id, { is_admin: !u.is_admin }); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!token || !confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionId(id);
    try { await deleteAdminUser(token, id); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setActionId(null); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{result?.meta.total.toLocaleString()} total</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..."
              className="pl-9 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 w-full sm:w-64" />
          </div>
          <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0">Search</button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Role</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="h-5 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))
            ) : result?.data.map((u) => (
              <tr key={u.id} className="hover:bg-white/2 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{u.name}</p>
                  <p className="text-zinc-500 text-xs">{u.email}</p>
                </td>
                <td className="px-5 py-3 text-zinc-500 hidden md:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  {u.is_admin
                    ? <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/20 rounded px-2 py-0.5">Admin</span>
                    : <span className="text-xs text-zinc-500">User</span>}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => toggleAdmin(u)} disabled={actionId === u.id}
                      title={u.is_admin ? "Remove admin" : "Make admin"}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors disabled:opacity-40">
                      {u.is_admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(u.id, u.name)} disabled={actionId === u.id}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {result && result.meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Page {page} of {result.meta.last_page}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(result.meta.last_page, p + 1))} disabled={page === result.meta.last_page}
                className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
