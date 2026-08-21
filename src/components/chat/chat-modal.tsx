"use client";

import { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
import { MessageCircle, Send, X, Wifi, WifiOff, Users } from "lucide-react";
import type { User } from "@/types/auth";
import type { ChatMessage } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { resolveStorageUrl } from "@/lib/api";

// ── Pure helpers (memoisation-friendly, stable references) ───────────────────

function timeLabel(iso: string): string {
  const d      = new Date(iso);
  const now    = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000)      return "just now";
  if (diffMs < 3_600_000)   return `${Math.floor(diffMs / 60_000)}m ago`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-red-600", "bg-orange-600", "bg-amber-600", "bg-emerald-600",
  "bg-cyan-600", "bg-blue-600",  "bg-violet-600", "bg-pink-600",
];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── MessageBubble — memoized so stable messages never re-render ──────────────

const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
}: {
  msg: ChatMessage;
  isOwn: boolean;
}) {
  // Compute derived values once per render of this bubble (only when msg changes)
  const avatarSrc  = useMemo(() => resolveStorageUrl(msg.avatar) ?? "", [msg.avatar]);
  const initStr    = useMemo(() => initials(msg.name),  [msg.name]);
  const colorClass = useMemo(() => avatarColor(msg.name), [msg.name]);
  const time       = useMemo(() => timeLabel(msg.createdAt), [msg.createdAt]);

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
        {msg.avatar && <AvatarImage src={avatarSrc} alt={msg.name} />}
        <AvatarFallback className={`text-[10px] font-bold text-white ${colorClass}`}>
          {initStr}
        </AvatarFallback>
      </Avatar>

      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        <span className="text-[10px] text-zinc-500 px-1">
          {isOwn ? "You" : msg.name}
        </span>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
            isOwn
              ? "bg-red-600 text-white rounded-tr-sm"
              : "bg-zinc-800 text-zinc-100 rounded-tl-sm"
          }`}
        >
          {msg.body}
        </div>
        <span className="text-[9px] text-zinc-600 px-1">{time}</span>
      </div>
    </div>
  );
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  messages: ChatMessage[];
  onlineCount: number;
  connected: boolean;
  sendMessage: (body: string) => void;
  guestName: string;
}

// ── Main modal component ──────────────────────────────────────────────────────

export default function ChatModal({
  open,
  onClose,
  user,
  messages,
  onlineCount,
  connected,
  sendMessage,
  guestName,
}: ChatModalProps) {
  const displayName  = user?.name ?? guestName;
  const [input, setInput] = useState("");
  const scrollRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const prevLenRef   = useRef(0);
  // Track whether the user has scrolled up (don't auto-scroll if so)
  const userScrolled = useRef(false);

  // Auto-scroll only when:
  //  • the modal is open, AND
  //  • a new message was appended (not history load or unrelated re-render), AND
  //  • the user hasn't scrolled up manually
  useEffect(() => {
    if (!open || !scrollRef.current) return;

    const newLen = messages.length;
    const added  = newLen > prevLenRef.current;
    prevLenRef.current = newLen;

    if (!added) return; // history load or re-render — don't jump

    const el = scrollRef.current;
    const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop < 80;

    if (!userScrolled.current || atBottom) {
      el.scrollTop = el.scrollHeight;
      userScrolled.current = false;
    }
  }, [messages, open]);

  // Detect manual upward scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop < 80;
    userScrolled.current = !atBottom;
  }, []);

  // Scroll to bottom and focus input when modal opens
  useEffect(() => {
    if (!open) return;
    // Scroll to bottom on open
    requestAnimationFrame(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      inputRef.current?.focus();
    });
    userScrolled.current = false;
  }, [open]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    // Force scroll to bottom on own send
    userScrolled.current = false;
    requestAnimationFrame(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, [input, sendMessage]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Pre-compute own userId/name once per render (not inside .map)
  const ownUserId   = user?.id ?? null;
  const ownGuestName = guestName;

  // Stable identity badge values
  const identityAvatarSrc = useMemo(
    () => resolveStorageUrl(user?.profile_picture) ?? "",
    [user?.profile_picture],
  );
  const identityColor    = useMemo(() => avatarColor(displayName), [displayName]);
  const identityInitials = useMemo(() => initials(displayName),    [displayName]);

  // Keep modal mounted but hidden — preserves scroll position and avoids
  // remount cost (socket listeners, DOM rebuild) on every toggle
  return (
    <div
      role="dialog"
      aria-label="Lobby"
      aria-hidden={!open}
      className={`fixed bottom-36 md:bottom-22 right-4 md:right-6
                  w-[calc(100vw-2rem)] sm:w-[360px] max-w-sm
                  bg-zinc-950 border border-white/10 rounded-2xl
                  shadow-2xl shadow-black/70 flex flex-col overflow-hidden z-[60]
                  transition-all duration-200 origin-bottom-right
                  ${open
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                  }`}
      style={{ height: "480px" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-white">Lobby</span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
            <Users className="w-3 h-3" />
            {onlineCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connected
            ? <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            : <WifiOff className="w-3.5 h-3.5 text-zinc-600 animate-pulse" />
          }
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="text-zinc-500 hover:text-white transition-colors rounded-full p-0.5 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Identity badge ── */}
      <div className="px-4 py-2 bg-zinc-900/50 border-b border-white/5 flex items-center gap-2 flex-shrink-0">
        <Avatar className="w-5 h-5">
          {user?.profile_picture && (
            <AvatarImage src={identityAvatarSrc} alt={displayName} />
          )}
          <AvatarFallback className={`text-[8px] font-bold text-white ${identityColor}`}>
            {identityInitials}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-zinc-400">
          Chatting as{" "}
          <span className="text-white font-medium">{displayName}</span>
          {!user && <span className="text-zinc-600 ml-1">(guest)</span>}
        </span>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-600 select-none">
            <MessageCircle className="w-8 h-8" />
            <p className="text-xs">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={ownUserId !== null ? msg.userId === ownUserId : msg.name === ownGuestName}
            />
          ))
        )}
      </div>

      <Separator className="bg-white/5 flex-shrink-0" />

      {/* ── Input ── */}
      <div className="px-3 py-3 flex items-center gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKey}
          placeholder={connected ? "Type a message…" : "Connecting…"}
          disabled={!connected}
          className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                     placeholder:text-zinc-500 outline-none focus:border-red-500/50 focus:ring-1
                     focus:ring-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          aria-label="Send message"
          className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl flex-shrink-0
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
