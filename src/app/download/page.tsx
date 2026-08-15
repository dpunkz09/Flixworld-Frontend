import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiFetch, API_BASE } from "@/lib/api";
import DownloadClient from "./download-client";

// -- Types ---------------------------------------------------------------------
export interface ScreenshotItem { url: string; caption: string; }
export interface FeatureItem    { icon: string; title: string; body: string; }

export interface DownloadPageData {
  headline:        string;
  subheadline:     string;
  badgeGooglePlay: string;
  badgeDirect:     string;
  badgeApkpure:    string;
  badgeUptodown:   string;
  screenshots:     ScreenshotItem[];
  features:        FeatureItem[];
  versionName:     string;
  versionCode:     number;
}

// -- Default features (shown when admin hasn't configured them yet) -------------
const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "Play",     title: "Stream Anywhere",   body: "Watch HD movies and TV shows on any Android device." },
  { icon: "Download", title: "Free to Download",  body: "No subscription required to get started." },
  { icon: "Bell",     title: "Stay Notified",     body: "Get alerts when friends comment on your favourite shows." },
  { icon: "Heart",    title: "Your Watchlist",    body: "Save titles and pick up right where you left off." },
];

// -- Server data fetch ---------------------------------------------------------
async function getPageData(): Promise<{ show: boolean; data: DownloadPageData }> {
  const fallback: DownloadPageData = {
    headline:        "Watch Movies & TV Shows Anywhere",
    subheadline:     "Stream thousands of titles on your Android device. Download the FlixWorld app for free.",
    badgeGooglePlay: "",
    badgeDirect:     "",
    badgeApkpure:    "",
    badgeUptodown:   "",
    screenshots:     [],
    features:        DEFAULT_FEATURES,
    versionName:     "1.0",
    versionCode:     1,
  };

  try {
    // Both endpoints are public -- no auth needed
    const [configRes, versionRes] = await Promise.all([
      apiFetch(`${API_BASE}/party/config`, { cache: "no-store" }),
      apiFetch(`${API_BASE}/app/version`,  { cache: "no-store" }),
    ]);

    const config  = configRes.ok  ? (await configRes.json())  as Record<string, unknown> : {};
    const version = versionRes.ok ? (await versionRes.json()) as Record<string, unknown> : {};

    const show = config["download_page_enabled"] !== false;

    const safeParse = <T,>(val: unknown, fb: T): T => {
      if (typeof val !== "string" || val === "") return fb;
      try { return JSON.parse(val) as T; } catch { return fb; }
    };

    return {
      show,
      data: {
        headline:        (config["download.headline"]        as string) || fallback.headline,
        subheadline:     (config["download.subheadline"]     as string) || fallback.subheadline,
        badgeGooglePlay: (config["download.badge_google_play"] as string) || "",
        badgeDirect:     (config["download.badge_direct"]    as string) || (version["apk_url"] as string) || "",
        badgeApkpure:    (config["download.badge_apkpure"]   as string) || "",
        badgeUptodown:   (config["download.badge_uptodown"]  as string) || "",
        screenshots:     safeParse<ScreenshotItem[]>(config["download.screenshots"], []),
        features:        safeParse<FeatureItem[]>(config["download.features"], DEFAULT_FEATURES),
        versionName:     (version["version_name"] as string)  || "1.0",
        versionCode:     (version["version_code"] as number)  || 1,
      },
    };
  } catch {
    return { show: true, data: fallback };
  }
}

// -- Metadata ------------------------------------------------------------------
export const metadata: Metadata = {
  title:       "Download FlixWorld App",
  description: "Download the FlixWorld Android app and stream movies & TV shows anywhere, for free.",
};

// -- Page ----------------------------------------------------------------------
export default async function DownloadPage() {
  const { show, data } = await getPageData();
  if (!show) notFound();
  return <DownloadClient data={data} />;
}
