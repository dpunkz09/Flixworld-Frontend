"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  id: string;
  userId: number | null;
  name: string;
  avatar: string | null;
  body: string;
  createdAt: string;
}

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_BASE ?? "https://api-backend.jpaworx.com/api")
    .replace(/\/api$/, "");

const MAX_MESSAGES = 100;

// ---------------------------------------------------------------------------
// Soft bonk — generated via Web Audio API, no audio file needed
// ---------------------------------------------------------------------------

function playBonk() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx  = new AudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext not available — silently skip
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat(
  guestName: string,
  token: string | null,
  open: boolean,
) {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const openRef   = useRef(open);
  // O(1) dedup set — avoids .some() O(n) scan on every incoming message
  const seenIds   = useRef(new Set<string>());

  // Keep openRef in sync without triggering re-renders
  useEffect(() => { openRef.current = open; }, [open]);

  // Reset unread when modal opens
  useEffect(() => { if (open) setUnreadCount(0); }, [open]);

  // Stable connect — recreates socket with fresh auth when token/guestName changes
  const connect = useCallback(() => {
    // Clean up existing socket first
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(`${SOCKET_URL}/chat`, {
      auth:  token ? { token } : { guestName },
      query: token ? { token } : { guestName },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      // Reuse the same connection across component lifecycle
      forceNew: false,
    });

    socketRef.current = socket;

    socket.on("connect",       () => setConnected(true));
    socket.on("disconnect",    () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("history", (history: ChatMessage[]) => {
      // Seed the dedup set from history
      seenIds.current = new Set(history.map((m) => m.id));
      setMessages(history);
    });

    socket.on("new_message", (msg: ChatMessage) => {
      // O(1) dedup — no array scan
      if (seenIds.current.has(msg.id)) return;
      seenIds.current.add(msg.id);

      // Keep set bounded — remove oldest ids when it grows large
      if (seenIds.current.size > MAX_MESSAGES * 2) {
        const arr = Array.from(seenIds.current);
        seenIds.current = new Set(arr.slice(-MAX_MESSAGES));
      }

      setMessages((prev) => {
        const next = prev.length >= MAX_MESSAGES
          ? [...prev.slice(-(MAX_MESSAGES - 1)), msg]
          : [...prev, msg];
        return next;
      });

      if (!openRef.current) {
        setUnreadCount((c) => c + 1);
        playBonk();
      }
    });

    socket.on("online_count", (count: number) => {
      setOnlineCount(count);
    });
  }, [guestName, token]);

  // Mount: connect once; unmount: disconnect
  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconnect when auth changes (login / logout)
  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, guestName]);

  const sendMessage = useCallback((body: string) => {
    const trimmed = body.trim();
    if (!trimmed || !socketRef.current?.connected) return;
    socketRef.current.emit("send_message", { body: trimmed });
  }, []);

  return { messages, onlineCount, connected, unreadCount, sendMessage };
}
