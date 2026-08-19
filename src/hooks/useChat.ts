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

/**
 * Manages the Socket.io connection to /chat namespace.
 *
 * @param guestName  - display name for anonymous users
 * @param token      - JWT for authenticated users (null for guests)
 * @param enabled    - only connect when the chat modal is open
 */
export function useChat(
  guestName: string,
  token: string | null,
  enabled: boolean,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: token
        ? { token }
        : { guestName },
      query: token
        ? { token }
        : { guestName },
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
        // Deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        // Keep at most 100 in the UI
        return next.length > 100 ? next.slice(-100) : next;
      });
    });

    socket.on("online_count", (count: number) => {
      setOnlineCount(count);
    });
  }, [guestName, token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setMessages([]);
    setOnlineCount(0);
  }, []);

  // Connect when enabled, disconnect when not
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const sendMessage = useCallback((body: string) => {
    const trimmed = body.trim();
    if (!trimmed || !socketRef.current?.connected) return;
    socketRef.current.emit("send_message", { body: trimmed });
  }, []);

  return { messages, onlineCount, connected, sendMessage };
}
