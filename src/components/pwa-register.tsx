"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// Extend the Window type for the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

// Module-level singleton — captured once, persists across React re-mounts and
// client-side navigations. Prevents re-registering the listener every page load.
let _capturedPrompt: BeforeInstallPromptEvent | null = null;
let _swRegistered = false;

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(_capturedPrompt);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register the service worker only once per session
    if (!_swRegistered && "serviceWorker" in navigator) {
      _swRegistered = true;
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[SW] Registered, scope:", reg.scope))
        .catch((err) => console.warn("[SW] Registration failed:", err));
    }

    // Already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Dismissed this session
    if (sessionStorage.getItem("pwa-banner-dismissed")) {
      setDismissed(true);
    }

    // If we already captured the prompt in a previous mount, use it
    if (_capturedPrompt) {
      setInstallPrompt(_capturedPrompt);
      return;
    }

    // Capture once — Chrome only fires this once per page session
    const handler = (e: Event) => {
      e.preventDefault(); // suppress the browser's automatic mini-infobar
      _capturedPrompt = e as BeforeInstallPromptEvent;
      setInstallPrompt(_capturedPrompt);
    };

    const installedHandler = () => {
      setInstalled(true);
      setInstallPrompt(null);
      _capturedPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      _capturedPrompt = null;
    }
    setInstallPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  }

  if (installed || dismissed || !installPrompt) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-96x96.png"
        alt="FlixWorld"
        className="w-12 h-12 rounded-xl flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">
          Install FlixWorld
        </p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-tight">
          Add to your home screen for the best experience
        </p>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="flex items-center justify-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors py-0.5"
        >
          <X className="w-3 h-3" />
          Not now
        </button>
      </div>
    </div>
  );
}
