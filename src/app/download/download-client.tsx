"use client";

import { useState } from "react";
import {
  Download, Play, Bell, Heart, Shield, Zap, Globe, Star,
  Monitor, Lock, Wifi, Smartphone, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { DownloadPageData, ScreenshotItem, FeatureItem } from "./page";

// -- Icon map -----------------------------------------------------------------

const ICON_MAP: Record<string, React.ElementType> = {
  Play, Bell, Heart, Shield, Zap, Globe, Star, Download,
  Monitor, Lock, Wifi, Smartphone,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Star;
  return <Icon className={className} />;
}

// -- Download badge buttons ----------------------------------------------------

function DownloadButton({
  href, label, sublabel, icon,
}: { href: string; label: string; sublabel: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl px-5 py-3 transition-all group"
    >
      <span className="text-white flex-shrink-0">{icon}</span>
      <span>
        <p className="text-[10px] text-zinc-400 group-hover:text-zinc-300 leading-none mb-0.5">{sublabel}</p>
        <p className="text-sm font-semibold text-white leading-none">{label}</p>
      </span>
    </a>
  );
}

// -- Screenshot carousel -------------------------------------------------------

function ScreenshotCarousel({ screenshots }: { screenshots: ScreenshotItem[] }) {
  const [idx, setIdx] = useState(0);
  if (screenshots.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + screenshots.length) % screenshots.length);
  const next = () => setIdx((i) => (i + 1) % screenshots.length);

  return (
    <section className="py-20 bg-zinc-950">
      <div className="px-6 md:px-12 lg:px-20">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
          Screenshots
        </h2>

        {/* Desktop: scrollable row */}
        <div className="hidden md:flex gap-4 overflow-x-auto pb-4 justify-center">
          {screenshots.map((s, i) => (
            <div key={i} className="flex-shrink-0 w-48">
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden ring-1 ring-white/10 bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.url}
                  alt={s.caption || `Screenshot ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {s.caption && (
                <p className="text-xs text-zinc-500 text-center mt-2">{s.caption}</p>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: one at a time */}
        <div className="md:hidden relative">
          <div className="relative aspect-[9/16] max-w-[220px] mx-auto rounded-2xl overflow-hidden ring-1 ring-white/10 bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshots[idx].url}
              alt={screenshots[idx].caption || `Screenshot ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          {screenshots[idx].caption && (
            <p className="text-xs text-zinc-500 text-center mt-2">
              {screenshots[idx].caption}
            </p>
          )}

          {screenshots.length > 1 && (
            <div className="flex items-center justify-center gap-6 mt-6">
              <button
                onClick={prev}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs text-zinc-500">
                {idx + 1} / {screenshots.length}
              </span>
              <button
                onClick={next}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// -- Feature grid --------------------------------------------------------------

function FeatureGrid({ features }: { features: FeatureItem[] }) {
  if (features.length === 0) return null;
  return (
    <section className="py-20 bg-black">
      <div className="px-6 md:px-12 lg:px-20">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
          Why FlixWorld?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-white/5 rounded-2xl p-6 text-center hover:border-red-500/30 hover:bg-zinc-800/60 transition-all"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-600/15 flex items-center justify-center">
                <DynamicIcon name={f.icon} className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -- Main component ------------------------------------------------------------

export default function DownloadClient({ data }: { data: DownloadPageData }) {
  const {
    headline, subheadline,
    badgeGooglePlay, badgeDirect, badgeApkpure, badgeUptodown,
    screenshots, features, versionName,
  } = data;

  const hasAnyBadge = badgeGooglePlay || badgeDirect || badgeApkpure || badgeUptodown;

  return (
    <div className="min-h-screen bg-black">
      {/* -- Hero ----------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-28 pb-24 md:pt-36 md:pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative px-6 md:px-12 lg:px-20 max-w-4xl mx-auto text-center">
          {/* App icon placeholder */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-2xl shadow-red-900/50">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-600/15 border border-red-500/20 rounded-full px-3 py-1 mb-4">
            <Smartphone className="w-3 h-3" />
            Android App  {versionName ? `v${versionName}` : ""}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            {headline}
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            {subheadline}
          </p>

          {/* Download buttons */}
          {hasAnyBadge && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {badgeGooglePlay && (
                <DownloadButton
                  href={badgeGooglePlay}
                  label="Google Play"
                  sublabel="Get it on"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M3.18 23.76c.37.2.81.19 1.21-.04l12.5-7.22-2.74-2.74-10.97 10zM.5 1.28C.19 1.66 0 2.21 0 2.9v18.2c0 .69.19 1.24.5 1.62l.09.08 10.2-10.2v-.24L.59 1.2l-.09.08zM19.83 10.41l-2.78-1.6-3.07 3.07 3.07 3.06 2.78-1.6c.8-.46.8-1.47 0-1.93zM4.39.28L16.89 7.5 14.15 10.24 3.18.24C3.58.01 4.02.03 4.39.28z"/>
                    </svg>
                  }
                />
              )}
              {badgeDirect && (
                <DownloadButton
                  href={badgeDirect}
                  label="Direct APK"
                  sublabel="Download"
                  icon={<Download className="w-6 h-6" />}
                />
              )}
              {badgeApkpure && (
                <DownloadButton
                  href={badgeApkpure}
                  label="APKPure"
                  sublabel="Download via"
                  icon={<Download className="w-6 h-6" />}
                />
              )}
              {badgeUptodown && (
                <DownloadButton
                  href={badgeUptodown}
                  label="Uptodown"
                  sublabel="Download via"
                  icon={<Download className="w-6 h-6" />}
                />
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-12 text-center">
            {[
              { value: "Free",   label: "No Subscription" },
              { value: "HD",     label: "Stream Quality"  },
              { value: "1000+",  label: "Titles"          },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Feature grid ---------------------------------------------------- */}
      <FeatureGrid features={features} />

      {/* -- Screenshots ----------------------------------------------------- */}
      <ScreenshotCarousel screenshots={screenshots} />

      {/* -- CTA bottom ------------------------------------------------------ */}
      {hasAnyBadge && (
        <section className="py-20 bg-gradient-to-b from-zinc-950 to-black">
          <div className="px-6 md:px-12 lg:px-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to watch?
            </h2>
            <p className="text-zinc-400 text-sm mb-8">
              Download FlixWorld now and start streaming on your Android device.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {badgeGooglePlay && (
                <a
                  href={badgeGooglePlay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
                >
                  <Download className="w-4 h-4" /> Google Play
                </a>
              )}
              {badgeDirect && (
                <a
                  href={badgeDirect}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
                >
                  <Download className="w-4 h-4" /> Direct APK
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
