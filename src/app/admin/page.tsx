"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, MessageSquare, Flag, TrendingUp, Eye,
  Bookmark, BarChart2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboard, type DashboardData } from "@/lib/admin-api";

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-zinc-400",
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex items-center gap-4 group-hover:border-white/10 transition-colors">
      <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getDashboard(token)
      .then((dash) => setData(dash))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="p-8">
        <div className="h-7 w-40 bg-zinc-800 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );

  if (!data) return null;

  const { stats } = data;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your FlixWorld platform</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"       value={stats.total_users}          icon={Users}         color="text-blue-400" />
        <StatCard label="Total Comments"    value={stats.total_comments}       icon={MessageSquare} color="text-purple-400" />
        <StatCard label="Pending Reports"   value={stats.pending_reports}      icon={Flag}          color="text-red-400" />
        <StatCard label="Titles Watched"    value={stats.total_most_watched}   icon={TrendingUp}    color="text-green-400" />
        <StatCard label="Watch Progress"    value={stats.total_watch_progress} icon={Eye}           color="text-yellow-400" />
        <StatCard label="Wishlisted"        value={stats.total_wishlists}      icon={Bookmark}      color="text-pink-400" />
        <StatCard label="Search Queries"    value={stats.total_search_queries} icon={BarChart2}     color="text-cyan-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent users */}
        <div className="lg:col-span-1 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Recent Users</h2>
          </div>
          <div className="divide-y divide-white/5">
            {data.recent_users.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
                {u.is_admin && (
                  <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top searches */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Top Searches</h2>
          </div>
          <div className="divide-y divide-white/5">
            {data.top_searches.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <p className="text-sm text-zinc-300 truncate flex-1">{s.query}</p>
                <span className="text-xs font-semibold text-zinc-500 ml-3 flex-shrink-0">
                  {s.count.toLocaleString()}x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top watched */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Most Watched</h2>
          </div>
          <div className="divide-y divide-white/5">
            {data.top_watched.map((w) => (
              <div key={w.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-300 truncate">
                    {w.title ?? `ID ${w.tmdb_id}`}
                  </p>
                  <p className="text-xs text-zinc-600 capitalize">{w.type}</p>
                </div>
                <span className="text-xs font-semibold text-zinc-500 ml-3 flex-shrink-0">
                  {w.watch_count.toLocaleString()}x
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
