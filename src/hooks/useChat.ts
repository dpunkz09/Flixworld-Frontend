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

// ---------------------------------------------------------------------------
// Soft bonk — generated via Web Audio API, no audio file needed
// ---------------------------------------------------------------------------

function playBonk() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
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
    // AudioContext not available (SSR / unsupported browser) — silently skip
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the Socket.io connection to /chat namespace.
 *
 * @param guestName  - display name for anonymous users
 * @param token      - JWT for authenticated users (null for guests)
 * @param open       - modal open state — when false, messages are counted as unread
 */
export function useChat(
  guestName: string,
  token: string | null,
  open: boolean,
) {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef  = useRef<Socket | null>(null);
  const openRef    = useRef(open);

  // Keep ref in sync so the socket event handler always reads the latest value
  useEffect(() => { openRef.current = open; }, [open]);

  // Reset unread when the modal is opened
  useEffect(() => { if (open) setUnreadCount(0); }, [open]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth:  token ? { token }     : { guestName },
      query: token ? { token }     : { guestName },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect",       () => setConnected(true));
    socket.on("disconnect",    () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("new_message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        return next.length > 100 ? next.slice(-100) : next;
      });

      // Only count + play sound when the modal is closed
      if (!openRef.current) {
        setUnreadCount((c) => c + 1);
        playBonk();
      }
    });

    socket.on("online_count", (count: number) => {
      setOnlineCount(count);
    });
  }, [guestName, token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  // Always stay connected so unread messages accumulate even when modal is closed
  useEffect(() => {
    connect();
    return () => { socketRef.current?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconnect if token/guestName changes (login / logout)
  useEffect(() => {
    disconnect();
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
