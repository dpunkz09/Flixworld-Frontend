"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trash2, RefreshCw, CheckCircle, AlertCircle, Database,
  HardDrive, BarChart2, Layers, MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdminCacheStatus, getAdminCacheStats, clearAdminCache,
  clearAdminChatHistory, refreshTmdbData,
  type CacheStats,
} from "@/lib/admin-api";

const CACHE_PATTERNS = [
  { label: "All Cache",            pattern: "*",              desc: "Clear everything from Redis" },
  { label: "Homepage",             pattern: "homepage:*",     desc: "Force homepage sections to refresh" },
  { label: "All Movies",           pattern: "movies:*",       desc: "Clear all movie lists and details" },
  { label: "All TV Shows",         pattern: "tv:*",           desc: "Clear all TV series lists and details" },
  { label: "Search Results",       pattern: "search:*",       desc: "Clear cached search queries" },
  { label: "People",               pattern: "person:*",       desc: "Clear person details and credits" },
  { label: "Companies",            pattern: "company:*",      desc: "Clear production company data" },
  { label: "Networks",             pattern: "network:*",      desc: "Clear TV network data" },
  { label: "Keywords",             pattern: "keyword:*",      desc: "Clear keyword associations" },
  { label: "Stream Cache",         pattern: "stream:*",       desc: "Clear stream URL cache" },
  { label: "Subtitles (Wyzie)",    pattern: "wyzie:*",        desc: "Clear subtitle search cache" },
  { label: "Subtitle VTT Files",   pattern: "subtitle:vtt:*", desc: "Clear cached .vtt subtitle file content" },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[Math.min(i, units.length - 1)]}`;
}

function usagePercent(used: number, peak: number): number {
  if (!peak) return 0;
  return Math.min(100, Math.round((used / peak) * 100));
}

function StatCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ElementType; label: string; value: string; color: string; bg: string;
}) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        <p className="text-[11px] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminCachePage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<{ redis_enabled: boolean; redis_connected: boolean } | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [refreshType, setRefreshType] = useState("movie");
  const [refreshId, setRefreshId] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStatus = useCallback(async () => {
    if (!token) return;
    try { setStatus(await getAdminCacheStatus(token)); } catch { /* ignore */ }
  }, [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await getAdminCacheStats(token);
      setStats(data);
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "Failed to load cache stats");
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStatus();
    void loadStats();
  }, [loadStatus, loadStats]);

  const handleClear = async (pattern: string) => {
    if (!token) return;
    setClearing(true);
    try {
      const r = await clearAdminCache(token, pattern);
      showToast(r.message);
      await loadStatus();
      await loadStats();
    } catch (e) {
      showToast((e as Error).message, false);
    } finally {
      setClearing(false);
    }
  };

  const handleClearChat = async () => {
    if (!token) return;
    setClearingChat(true);
    try {
      const r = await clearAdminChatHistory(token);
      showToast(r.message);
      await loadStats();
    } catch (e) {
      showToast((e as Error).message, false);
    } finally {
      setClearingChat(false);
    }
  };

  const handleRefresh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !refreshId) return;
    setClearing(true);
    try {
      const r = await refreshTmdbData(token, refreshType, Number(refreshId));
      showToast(r.message);
    } catch (e) {
      showToast((e as Error).message, false);
    } finally {
      setClearing(false);
    }
  };

  const pct = stats ? usagePercent(stats.used_memory_bytes, stats.peak_memory_bytes) : 0;
  // Show stats section whenever we have status loaded - not just when Redis is on.
  // When Redis is disabled, stats returns zeros which is still useful to display.
  const statusLoaded = status !== null;

  const statusText = () => {
    if (!status) return "Loading...";
    if (!status.redis_enabled) return "Disabled - running without cache";
    return status.redis_connected ? "Connected and caching requests" : "Enabled but not connected";
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Cache &amp; TMDB</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Redis memory usage, key counts, and TMDB refresh tools
        </p>
      </div>

      {/* Redis status */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex items-center gap-4">
        <Database className="w-6 h-6 text-zinc-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Redis Cache</p>
          <p className="text-xs text-zinc-500 mt-0.5">{statusText()}</p>
        </div>
        {status && (
          <div
            className={`flex items-center gap-1.5 text-sm font-medium flex-shrink-0 ${
              status.redis_connected ? "text-green-400" : "text-zinc-500"
            }`}
          >
            {status.redis_connected
              ? <CheckCircle className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />}
            {status.redis_connected ? "Connected" : "Disconnected"}
          </div>
        )}
      </div>

      {/* Memory stats - always shown once status is loaded */}
      {statusLoaded && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-zinc-400" />
              Memory Usage
            </h2>
            <button
              onClick={() => void loadStats()}
              disabled={statsLoading}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${statsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Note when Redis is disabled */}
          {!status?.redis_connected && (
            <div className="flex items-center gap-2 bg-zinc-800/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-zinc-500">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" />
              {status?.redis_enabled
                ? "Redis is enabled but not connected. Stats are unavailable."
                : "Redis is disabled. Enable it in Settings to see live cache statistics."}
            </div>
          )}

          {statsLoading && !stats ? (
            <div className="h-24 bg-zinc-900 rounded-xl animate-pulse border border-white/5" />
          ) : statsError ? (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Failed to load stats: {statsError}</span>
              <button
                onClick={() => void loadStats()}
                className="ml-auto text-zinc-400 hover:text-white underline"
              >
                Retry
              </button>
            </div>
          ) : stats ? (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={HardDrive} label="Used Memory"  value={stats.used_memory_human}          color="text-blue-400"   bg="bg-blue-500/10" />
                <StatCard icon={BarChart2} label="Peak Memory"  value={stats.peak_memory_human}          color="text-purple-400" bg="bg-purple-500/10" />
                <StatCard icon={Layers}    label="Total Keys"   value={stats.total_keys.toLocaleString()} color="text-green-400"  bg="bg-green-500/10" />
                <StatCard
                  icon={Database}
                  label="Usage vs Peak"
                  value={`${pct}%`}
                  color={pct > 80 ? "text-red-400" : pct > 60 ? "text-yellow-400" : "text-green-400"}
                  bg={pct > 80 ? "bg-red-500/10" : pct > 60 ? "bg-yellow-500/10" : "bg-green-500/10"}
                />
              </div>

              {/* Memory bar */}
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Used: <span className="text-white font-medium">{stats.used_memory_human}</span></span>
                  <span>Peak: <span className="text-white font-medium">{stats.peak_memory_human}</span></span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct > 80 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Per-pattern breakdown */}
              <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Keys &amp; Size per Pattern
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {stats.patterns
                    .filter((p) => p.key_count > 0)
                    .sort((a, b) => b.size_bytes - a.size_bytes)
                    .map((p) => {
                      const patternPct =
                        stats.used_memory_bytes > 0
                          ? Math.min(100, Math.round((p.size_bytes / stats.used_memory_bytes) * 100))
                          : 0;
                      const meta = CACHE_PATTERNS.find((c) => c.pattern === p.pattern);
                      const isChatKey = p.pattern === "chat:*";
                      return (
                        <div key={p.pattern} className="px-5 py-3 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-zinc-300 truncate flex items-center gap-1.5">
                                {isChatKey && <MessageCircle className="w-3 h-3 text-zinc-500 flex-shrink-0" />}
                                {meta?.label ?? p.pattern}
                              </span>
                              <span className="text-[10px] text-zinc-500 ml-2 flex-shrink-0 font-mono">
                                {p.key_count} {p.key_count === 1 ? "key" : "keys"} &middot; {formatBytes(p.size_bytes)}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500/70 transition-all duration-500"
                                style={{ width: `${patternPct}%` }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => isChatKey ? void handleClearChat() : void handleClear(p.pattern)}
                            disabled={isChatKey ? clearingChat : clearing}
                            title={`Clear ${p.pattern}`}
                            className="flex-shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  {stats.patterns.every((p) => p.key_count === 0) && (
                    <div className="px-5 py-6 text-center text-xs text-zinc-600">
                      No cached keys found.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Cache clear buttons */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Clear Cache by Pattern</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CACHE_PATTERNS.map(({ label, pattern, desc }) => (
            <button
              key={pattern}
              onClick={() => void handleClear(pattern)}
              disabled={clearing}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all disabled:opacity-50 group ${
                pattern === "*"
                  ? "border-red-500/30 bg-red-600/10 hover:bg-red-600/20 hover:border-red-500/50"
                  : "border-white/5 bg-zinc-900 hover:bg-white/5 hover:border-white/10"
              }`}
            >
              <Trash2
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  pattern === "*" ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <div>
                <p className={`text-sm font-medium ${pattern === "*" ? "text-red-400" : "text-white"}`}>
                  {label}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                <code className="text-[10px] text-zinc-600 mt-1 block">{pattern}</code>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat history */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-zinc-400" />
          Live Chat History
        </h2>
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Clear chat history</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Removes all chat messages from Redis and the in-memory buffer.
              Active users will see an empty chat until new messages are sent.
            </p>
            <div className="flex items-center gap-3 mt-2">
              {stats?.patterns.find((p) => p.pattern === "chat:*") && (
                <span className="text-[11px] text-zinc-500 font-mono bg-zinc-800 px-2 py-0.5 rounded">
                  {stats.patterns.find((p) => p.pattern === "chat:*")!.key_count} key
                  {" · "}
                  {formatBytes(stats.patterns.find((p) => p.pattern === "chat:*")!.size_bytes)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => void handleClearChat()}
            disabled={clearingChat}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600
                       text-white text-sm font-medium rounded-lg transition-colors
                       disabled:opacity-50 flex-shrink-0"
          >
            {clearingChat ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Clear Chat
          </button>
        </div>
      </div>

      {/* TMDB refresh */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Refresh TMDB Data for a Title</h2>
        <form
          onSubmit={handleRefresh}
          className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Type</label>
            <select
              value={refreshType}
              onChange={(e) => setRefreshType(e.target.value)}
              className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="movie">Movie</option>
              <option value="tv">TV Show</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">TMDB ID</label>
            <input
              type="number"
              required
              value={refreshId}
              onChange={(e) => setRefreshId(e.target.value)}
              className="w-36 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              placeholder="e.g. 550"
            />
          </div>
          <button
            type="submit"
            disabled={clearing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <p className="text-xs text-zinc-500 w-full sm:w-auto sm:self-center">
            Clears the cached detail for this title. Next request fetches fresh data from TMDB.
          </p>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium z-50 ${
            toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
