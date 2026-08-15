"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import {
  MessageCircle,
  Reply,
  Trash2,
  Bell,
  BellOff,
  ChevronDown,
  Loader2,
  Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveStorageUrl } from "@/lib/api";
import {
  getCommentsApi,
  postCommentApi,
  deleteCommentApi,
  followThreadApi,
  unfollowThreadApi,
} from "@/lib/comments-api";
import type { Comment } from "@/types/comments";
import Link from "next/link";

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Avatar({ name, picture, size = "sm" }: { name: string; picture: string | null; size?: "sm" | "md" }) {
  const url = resolveStorageUrl(picture);
  const cls = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <span className={`${cls} rounded-full overflow-hidden bg-red-600 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

function ComposeBox({
  onSubmit,
  placeholder = "Write a comment...",
  autoFocus = false,
  compact = false,
}: {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      <textarea
        ref={ref}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={1000}
        rows={compact ? 2 : 3}
        className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-colors"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-600">{body.length}/1000</span>
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Post
        </button>
      </div>
    </form>
  );
}

function PlatformBadge({ platform }: { platform?: "web" | "android" }) {
  if (!platform || platform === "web") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-zinc-500 bg-zinc-800 border border-white/8 rounded px-1.5 py-0.5 leading-none">
        <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
        </svg>
        Web
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-zinc-500 bg-zinc-800 border border-white/8 rounded px-1.5 py-0.5 leading-none">
      <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
      </svg>
      Android
    </span>
  );
}

function CommentCard({
  comment,
  type,
  tmdbId,
  mediaTitle,
  onDelete,
  onReplyPosted,
  depth = 0,
}: {
  comment: Comment;
  type: "movie" | "tv";
  tmdbId: number;
  mediaTitle: string;
  onDelete: (id: number) => void;
  onReplyPosted: (reply: Comment, parentId: number) => void;
  depth?: number;
}) {
  const { user, token } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!token || deleting) return;
    setDeleting(true);
    try {
      await deleteCommentApi(token, comment.id);
      onDelete(comment.id);
    } catch {
      setDeleting(false);
    }
  }

  async function handleReply(body: string) {
    if (!token) return;
    const reply = await postCommentApi(token, type, tmdbId, {
      body,
      parent_id: comment.id,
      media_title: mediaTitle,
      platform: "web",
    });
    onReplyPosted(reply, comment.id);
    setReplyOpen(false);
  }

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-8 pl-4 border-l border-white/5" : ""}`}>
      <Avatar name={comment.user.name} picture={comment.user.profile_picture} />

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{comment.user.name}</span>
          <PlatformBadge platform={comment.platform} />
          <span className="text-xs text-zinc-500">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Body */}
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-0.5">
          {user && depth === 0 && (
            <button
              onClick={() => setReplyOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
              {comment.reply_count > 0 && (
                <span className="text-zinc-600">({comment.reply_count})</span>
              )}
            </button>
          )}
          {comment.is_mine && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {/* Reply compose */}
        {replyOpen && (
          <div className="pt-2">
            <ComposeBox
              onSubmit={handleReply}
              placeholder={`Reply to ${comment.user.name}...`}
              autoFocus
              compact
            />
          </div>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className="space-y-4 pt-2">
            {comment.replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                type={type}
                tmdbId={tmdbId}
                mediaTitle={mediaTitle}
                onDelete={onDelete}
                onReplyPosted={onReplyPosted}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentsSectionProps {
  type: "movie" | "tv";
  tmdbId: number;
  mediaTitle: string;
}

export default function CommentsSection({
  type,
  tmdbId,
  mediaTitle,
}: CommentsSectionProps) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchComments = useCallback(
    async (p: number, append = false) => {
      try {
        const res = await getCommentsApi(type, tmdbId, p, token);
        if (!mountedRef.current) return;
        setComments((prev) => (append ? [...prev, ...res.data] : res.data));
        setLastPage(res.meta.last_page);
        setTotal(res.meta.total);
        setIsFollowing(res.is_following);
      } catch (err) {
        if (mountedRef.current)
          setError(err instanceof Error ? err.message : "Failed to load comments.");
      }
    },
    [type, tmdbId, token]
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchComments(1).finally(() => {
      if (mountedRef.current) setLoading(false);
    });
  }, [fetchComments]);

  const loadMore = useCallback(async () => {
    const next = page + 1;
    setLoadingMore(true);
    await fetchComments(next, true);
    if (mountedRef.current) {
      setPage(next);
      setLoadingMore(false);
    }
  }, [fetchComments, page]);

  const handlePost = useCallback(async (body: string) => {
    if (!token) return;
    const comment = await postCommentApi(token, type, tmdbId, {
      body,
      media_title: mediaTitle,
      platform: "web",
    });
    if (!mountedRef.current) return;
    setComments((prev) => [comment, ...prev]);
    setTotal((t) => t + 1);
    setIsFollowing(true);
  }, [token, type, tmdbId, mediaTitle]);

  const handleDelete = useCallback((id: number) => {
    function remove(list: Comment[]): Comment[] {
      return list
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: remove(c.replies ?? []) }));
    }
    setComments((prev) => remove(prev));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const handleReplyPosted = useCallback((reply: Comment, parentId: number) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? {
              ...c,
              replies: [...(c.replies ?? []), reply],
              reply_count: c.reply_count + 1,
            }
          : c
      )
    );
  }, []);

  const toggleFollow = useCallback(async () => {
    if (!token || followLoading) return;
    setFollowLoading(true);
    try {
      const res = isFollowing
        ? await unfollowThreadApi(token, type, tmdbId)
        : await followThreadApi(token, type, tmdbId);
      if (mountedRef.current) setIsFollowing(res.is_following);
    } finally {
      if (mountedRef.current) setFollowLoading(false);
    }
  }, [token, followLoading, isFollowing, type, tmdbId]);

  return (
    <section className="px-6 md:px-12 lg:px-20 py-10 border-t border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-zinc-500" />
          Comments
          {total > 0 && (
            <span className="text-sm font-normal text-zinc-500">({total})</span>
          )}
        </h2>

        {user && (
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {followLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isFollowing ? (
              <BellOff className="w-3.5 h-3.5" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
            {isFollowing ? "Unfollow thread" : "Follow thread"}
          </button>
        )}
      </div>

      {/* Compose - logged in only */}
      {user ? (
        <div className="flex gap-3 mb-8">
          <Avatar name={user.name} picture={user.profile_picture} size="md" />
          <div className="flex-1">
            <ComposeBox onSubmit={handlePost} />
          </div>
        </div>
      ) : (
        <div className="mb-8 px-4 py-3 rounded-lg bg-zinc-900/60 border border-white/8 text-sm text-zinc-400">
          <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">Sign in</Link>
          {" "}to join the discussion.
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-zinc-800" />
                <div className="h-4 w-full rounded bg-zinc-800" />
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-zinc-500">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-500">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              type={type}
              tmdbId={tmdbId}
              mediaTitle={mediaTitle}
              onDelete={handleDelete}
              onReplyPosted={handleReplyPosted}
            />
          ))}

          {page < lastPage && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50 mx-auto"
            >
              {loadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Load more comments
            </button>
          )}
        </div>
      )}
    </section>
  );
}
