"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminReports, updateAdminReport, deleteAdminReport, type VideoReport, type Paginated } from "@/lib/admin-api";

const STATUS_FILTERS = ["", "pending", "reviewed", "resolved", "dismissed"];
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-600/20 text-yellow-400 border-yellow-500/20",
  reviewed:  "bg-blue-600/20 text-blue-400 border-blue-500/20",
  resolved:  "bg-green-600/20 text-green-400 border-green-500/20",
  dismissed: "bg-zinc-600/20 text-zinc-400 border-zinc-500/20",
};

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<Paginated<VideoReport> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminReports(token, page, status || undefined)
      .then(setResult).catch(console.error).finally(() => setLoading(false));
  }, [token, page, status]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    setUpdating(id);
    try { await updateAdminReport(token, id, { status: newStatus }); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete this report?")) return;
    setUpdating(id);
    try { await deleteAdminReport(token, id); load(); }
    catch (e) { alert((e as Error).message); }
    finally { setUpdating(null); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Reported Videos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{result?.meta.total.toLocaleString()} total</p>
        </div>
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-1 bg-zinc-900 border border-white/10 rounded-lg p-1">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${status === s ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />)
        ) : result?.data.map((r) => (
          <div key={r.id} className="bg-zinc-900 border border-white/5 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-medium border rounded px-1.5 py-0.5 ${STATUS_COLORS[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-zinc-500 capitalize">{r.type} #{r.tmdb_id}</span>
                  {r.title && <span className="text-xs text-zinc-400 font-medium">{r.title}</span>}
                </div>
                <p className="text-sm text-white mt-2 font-medium capitalize">{r.reason.replace(/_/g, " ")}</p>
                {r.notes && <p className="text-xs text-zinc-400 mt-1">{r.notes}</p>}
                <p className="text-xs text-zinc-600 mt-2">
                  Reported by <span className="text-zinc-500">{r.user.name}</span> &middot; {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => changeStatus(r.id, "resolved")} disabled={updating === r.id || r.status === "resolved"}
                  title="Mark resolved" className="p-1.5 rounded text-zinc-500 hover:text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-30">
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button onClick={() => changeStatus(r.id, "dismissed")} disabled={updating === r.id || r.status === "dismissed"}
                  title="Dismiss" className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-30">
                  <XCircle className="w-4 h-4" />
                </button>
                <button onClick={() => changeStatus(r.id, "reviewed")} disabled={updating === r.id || r.status === "reviewed"}
                  title="Mark reviewed" className="p-1.5 rounded text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors disabled:opacity-30">
                  <Clock className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(r.id)} disabled={updating === r.id}
                  className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && result?.data.length === 0 && (
          <div className="text-center py-16 text-zinc-500 text-sm">No reports found.</div>
        )}
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
