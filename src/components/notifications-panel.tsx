"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Loader2, MessageCircle, Flag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "@/lib/notifications-api";
import type { Notification, ReportNotificationData, CommentNotificationData } from "@/types/notifications";

/** Polling interval in ms */
const POLL_INTERVAL = 60_000;

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function notifHref(n: Notification): string {
  // Report update notification -- link to the media page
  if (n.data.type === "report_update") {
    const d = n.data;
    const slug = d.media_title
      ? `${d.media_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").slice(0, 60)}-${d.tmdb_id}`
      : String(d.tmdb_id);
    return d.media_type === "movie" ? `/movies/${slug}` : `/tv/${slug}`;
  }
  // Comment notification
  const { media_type, tmdb_id, media_title } = n.data;
  const slug = media_title
    ? `${media_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").slice(0, 60)}-${tmdb_id}`
    : String(tmdb_id);
  return media_type === "movie" ? `/movies/${slug}` : `/tv/${slug}`;
}

export default function NotificationsPanel() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Poll unread count
  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const { unread_count } = await getUnreadCountApi(token);
      setUnreadCount(unread_count);
    } catch { /* silently ignore */ }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void fetchUnread();
    const id = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchUnread, token]);

  // Fetch full list when panel opens - guard against setting state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function openPanel() {
    if (!token) return;
    setOpen(true);
    setLoading(true);
    try {
      const res = await getNotificationsApi(token);
      if (!mountedRef.current) return;
      setNotifications(res.data);
      setUnreadCount(res.meta.unread_count);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function handleMarkRead(n: Notification) {
    if (!token || n.read_at) return;
    setNotifications((prev) =>
      prev.map((x) =>
        x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationReadApi(token, n.id);
    } catch { /* best effort */ }
  }

  async function handleMarkAll() {
    if (!token || markingAll) return;
    setMarkingAll(true);
    setNotifications((prev) =>
      prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
    try {
      await markAllNotificationsReadApi(token);
    } finally {
      setMarkingAll(false);
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label="Notifications"
        className="relative flex text-zinc-300 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 items-center justify-center transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-0.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs font-normal text-zinc-400">
                  ({unreadCount} unread)
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-500">
                <Bell className="w-8 h-8 text-zinc-700" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
            notifications.map((n) => {
                const isReport = n.data.type === "report_update";
                const reportData = isReport ? (n.data as ReportNotificationData) : null;
                const commentData = !isReport ? (n.data as CommentNotificationData) : null;

                const STATUS_LABELS: Record<string, string> = {
                  reviewed:  "under review",
                  resolved:  "resolved",
                  dismissed: "dismissed",
                };

                return (
                  <Link
                    key={n.id}
                    href={notifHref(n)}
                    onClick={() => {
                      void handleMarkRead(n);
                      setOpen(false);
                    }}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
                      !n.read_at ? "bg-red-500/5" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                      isReport ? "bg-red-600/20" : "bg-zinc-800"
                    }`}>
                      {isReport
                        ? <Flag className="w-4 h-4 text-red-400" />
                        : <MessageCircle className="w-4 h-4 text-zinc-400" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      {isReport && reportData ? (
                        <>
                          <p className="text-xs text-zinc-300 leading-snug">
                            Your report for{" "}
                            <span className="font-semibold text-white">
                              {reportData.media_title}
                            </span>{" "}
                            is{" "}
                            <span className={`font-semibold ${
                              reportData.status === "resolved"
                                ? "text-green-400"
                                : reportData.status === "dismissed"
                                ? "text-zinc-400"
                                : "text-yellow-400"
                            }`}>
                              {STATUS_LABELS[reportData.status] ?? reportData.status}
                            </span>
                          </p>
                          {reportData.admin_note && (
                            <p className="text-xs text-zinc-500 line-clamp-2">
                              {reportData.admin_note}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-zinc-300 leading-snug">
                            <span className="font-semibold text-white">
                              {commentData?.commenter_name}
                            </span>{" "}
                            {commentData?.parent_id ? "replied in" : "commented on"}{" "}
                            <span className="font-medium text-white">
                              {n.data.media_title}
                            </span>
                          </p>
                          <p className="text-xs text-zinc-500 line-clamp-2">
                            {commentData?.body_preview}
                          </p>
                        </>
                      )}
                      <p className="text-[10px] text-zinc-600">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read_at && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  void handleMarkAll();
                }}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                <Check className="w-3 h-3 inline mr-1" />
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
