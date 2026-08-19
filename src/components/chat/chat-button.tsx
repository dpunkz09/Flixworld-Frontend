"use client";

import { useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import ChatModal from "./chat-modal";

const GUEST_NAME_KEY = "fw_chat_guest_name";

/** Called at most once per component lifetime via useRef initialiser. */
function initGuestName(): string {
  try {
    const stored = sessionStorage.getItem(GUEST_NAME_KEY);
    if (stored) return stored;
    const name = `Guest#${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem(GUEST_NAME_KEY, name);
    return name;
  } catch {
    return `Guest#${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

/**
 * Floating chat button — bottom-right corner on every public page.
 * • Unread badge when messages arrive while modal is closed.
 * • Soft bonk sound on each new message (Web Audio API).
 * • Modal stays mounted (CSS visibility) to preserve scroll position.
 */
export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const { user, token } = useAuth();

  // Initialised exactly once — useRef(() => fn()) lazy init pattern
  const guestNameRef = useRef<string | null>(null);
  if (guestNameRef.current === null) {
    guestNameRef.current = initGuestName();
  }
  const guestName = guestNameRef.current;

  const { messages, onlineCount, connected, unreadCount, sendMessage } = useChat(
    guestName,
    token,
    open,
  );

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open live chat"}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[59]
                   w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 active:scale-95
                   text-white shadow-lg shadow-red-900/40 flex items-center justify-center
                   transition-all duration-200"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}

        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
                       flex items-center justify-center rounded-full
                       bg-white text-red-600 text-[10px] font-bold
                       px-1 leading-none shadow-md animate-in zoom-in duration-150"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Modal stays in DOM — toggled via opacity/scale in chat-modal.tsx */}
      <ChatModal
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        messages={messages}
        onlineCount={onlineCount}
        connected={connected}
        sendMessage={sendMessage}
        guestName={guestName}
      />
    </>
  );
}
