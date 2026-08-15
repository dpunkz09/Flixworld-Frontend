"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminStreamUrls, upsertAdminStreamUrl, deleteAdminStreamUrl, type CustomStreamUrl, type Paginated } from "@/lib/admin-api";

function UpsertForm({ token, onSaved }: { token: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "movie", tmdb_id: "", title: "", urls: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = form.urls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!form.tmdb_id || urlList.length === 0) return;
    setLoading(true);
    try {
      await upsertAdminStreamUrl(token, {
        type: form.type,
        tmdb_id: Number(form.tmdb_id),
        title: form.title || undefined,
        stream_urls: urlList,
        notes: form.notes || undefined,
      });
      setForm({ type: "movie", tmdb_id: "", title: "", urls: "", notes: "" });
      setOpen(false);
      onSaved();
    } catch (e) { alert((e as Error).message); }
    finally { setLoading(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
      <Plus className="w-4 h-4" /> Add / Update URL
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Add / Update Stream URL</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Type</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">TMDB ID *</label>
          <input required type="number" value={form.tmdb_id} onChange={(e) => setForm((f) => ({ ...f, tmdb_id: e.target.value }))}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" placeholder="e.g. 550" />
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Title (optional)</label>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Stream URLs (one per line) *</label>
        <textarea required rows={4} value={form.urls} onChange={(e) => setForm((f) => ({ ...f, urls: e.target.value }))}
          className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-mono text-xs resize-none"
          placeholder="https://example.com/stream.m3u8" />
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Notes (optional)</label>
        <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          {loading ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminStreamUrlsPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<Paginated<CustomStreamUrl> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminStreamUrls(token, page).then(setResult).catch(console.error).finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete this stream URL?")) return;
    setDeleting(id);
    try { await deleteAdminStreamUrl(token, id); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Stream URLs</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Override stream URLs for specific titles &middot; {result?.meta.total ?? 0} entries</p>
        </div>
        {token && <UpsertForm token={token} onSaved={load} />}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />)
        ) : result?.data.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm bg-zinc-900 border border-white/5 rounded-xl">No custom stream URLs. Add one above.</div>
        ) : result?.data.map((s) => (
          <div key={s.id} className="bg-zinc-900 border border-white/5 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs bg-zinc-800 text-zinc-400 rounded px-1.5 py-0.5 capitalize">{s.type}</span>
                  <span className="text-xs text-zinc-500">#{s.tmdb_id}</span>
                  {s.title && <span className="text-sm font-medium text-white">{s.title}</span>}
                  {!s.active && <span className="text-xs bg-zinc-700 text-zinc-400 rounded px-1.5 py-0.5">Inactive</span>}
                </div>
                <div className="space-y-1">
                  {s.stream_urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Link2 className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                      <p className="text-xs text-zinc-400 font-mono truncate">{url}</p>
                    </div>
                  ))}
                </div>
                {s.notes && <p className="text-xs text-zinc-600 mt-2">{s.notes}</p>}
              </div>
              <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {result && result.meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">Page {page} of {result.meta.last_page}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage((p) => Math.min(result.meta.last_page, p + 1))} disabled={page === result.meta.last_page} className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
