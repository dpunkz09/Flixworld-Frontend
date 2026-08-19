"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatModal from "./chat-modal";

/**
 * Floating chat button that lives in the bottom-right corner of every page.
 * Renders the chat modal when clicked.
 * Positioned above the mobile bottom nav (bottom-20 on mobile, bottom-6 on md+).
 */
export default function ChatButton() {
  const [open, setOpen] = useState(false);

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
        style={{
          // Push up when modal is open so the button doesn't overlap the input
          bottom: open ? "unset" : undefined,
          // On mobile, sit just above the bottom nav
        }}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
      </button>

      {/* Chat modal — anchored above the button */}
      <ChatModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
