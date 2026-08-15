"use client";

import { useEffect, useState, useCallback, type FormEvent, type ReactNode } from "react";
import {
  Download, Save, Loader2, CheckCircle2, AlertCircle,
  Plus, Trash2, GripVertical, Smartphone, Image, Type, Link,
  Eye, EyeOff, Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminSettings, saveAdminSettings, type SiteSettings } from "@/lib/admin-api";

// -- UI primitives -------------------------------------------------------------

function Section({ title, icon: Icon, color, children }: {
  title: string; icon: React.ElementType; color: string; children: ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-zinc-800 border border-white/10 focus:border-white/30 text-white placeholder-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${mono ? "font-mono" : ""}`}
    />
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-zinc-800 border border-white/10 focus:border-white/30 text-white placeholder-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors resize-y"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors ${
        checked ? "bg-red-600 border-red-600" : "bg-zinc-700 border-zinc-700"
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transform transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

// -- Screenshot list editor ----------------------------------------------------

interface ScreenshotItem { url: string; caption: string; }

function ScreenshotEditor({ value, onChange }: {
  value: ScreenshotItem[]; onChange: (v: ScreenshotItem[]) => void;
}) {
  const add    = () => onChange([...value, { url: "", caption: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ScreenshotItem, v: string) =>
    onChange(value.map((s, idx) => idx === i ? { ...s, [field]: v } : s));

  return (
    <div className="space-y-3">
      {value.map((s, i) => (
        <div key={i} className="flex items-start gap-2 bg-zinc-800/60 rounded-lg p-3">
          <GripVertical className="w-4 h-4 text-zinc-600 mt-2 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <input
              value={s.url}
              onChange={(e) => update(i, "url", e.target.value)}
              placeholder="Screenshot URL (https://...)"
              className="w-full bg-zinc-800 border border-white/10 text-white placeholder-zinc-600 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-white/30"
            />
            <input
              value={s.caption}
              onChange={(e) => update(i, "caption", e.target.value)}
              placeholder="Caption (optional)"
              className="w-full bg-zinc-800 border border-white/10 text-white placeholder-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-white/30"
            />
          </div>
          <button onClick={() => remove(i)} className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors mt-0.5">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <Plus className="w-4 h-4" /> Add screenshot
      </button>
    </div>
  );
}

// -- Feature list editor -------------------------------------------------------

interface FeatureItem { icon: string; title: string; body: string; }

const ICON_OPTIONS = [
  "Smartphone", "Star", "Shield", "Zap", "Globe", "Download",
  "Play", "Heart", "Bell", "Lock", "Wifi", "Monitor",
];

function FeatureEditor({ value, onChange }: {
  value: FeatureItem[]; onChange: (v: FeatureItem[]) => void;
}) {
  const add    = () => onChange([...value, { icon: "Star", title: "", body: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof FeatureItem, v: string) =>
    onChange(value.map((f, idx) => idx === i ? { ...f, [field]: v } : f));

  return (
    <div className="space-y-3">
      {value.map((f, i) => (
        <div key={i} className="flex items-start gap-2 bg-zinc-800/60 rounded-lg p-3">
          <GripVertical className="w-4 h-4 text-zinc-600 mt-2 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <select
                value={f.icon}
                onChange={(e) => update(i, "icon", e.target.value)}
                className="bg-zinc-800 border border-white/10 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-white/30 w-32"
              >
                {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <input
                value={f.title}
                onChange={(e) => update(i, "title", e.target.value)}
                placeholder="Feature title"
                className="flex-1 bg-zinc-800 border border-white/10 text-white placeholder-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <textarea
              value={f.body}
              onChange={(e) => update(i, "body", e.target.value)}
              placeholder="Short description"
              rows={2}
              className="w-full bg-zinc-800 border border-white/10 text-white placeholder-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-white/30 resize-none"
            />
          </div>
          <button onClick={() => remove(i)} className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors mt-0.5">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <Plus className="w-4 h-4" /> Add feature
      </button>
    </div>
  );
}

// -- Defaults ------------------------------------------------------------------

const EMPTY_SETTINGS: Partial<SiteSettings> = {
  "download.show_page":        true,
  "download.headline":         "Watch Movies & TV Shows Anywhere",
  "download.subheadline":      "Stream thousands of titles on your Android device.",
  "download.badge_google_play": "",
  "download.badge_direct":     "",
  "download.badge_apkpure":    "",
  "download.badge_uptodown":   "",
  "download.screenshots":      "[]",
  "download.features":         "[]",
};

const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "Play",       title: "Stream Anywhere",   body: "Watch movies and TV shows in HD on your Android device." },
  { icon: "Download",   title: "Free to Download",  body: "No subscription needed to get started." },
  { icon: "Bell",       title: "Stay Updated",      body: "Get notified when friends comment on your favourite shows." },
  { icon: "Heart",      title: "Save Your List",    body: "Bookmark titles and pick up right where you left off." },
];

// -- Page ----------------------------------------------------------------------

export default function AdminDownloadPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Partial<SiteSettings>>(EMPTY_SETTINGS);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [features,    setFeatures]    = useState<FeatureItem[]>(DEFAULT_FEATURES);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [toast,   setToast]     = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getAdminSettings(token) as unknown as Record<string, unknown>;
      const merged = { ...EMPTY_SETTINGS, ...data };
      setSettings(merged as Partial<SiteSettings>);
      try { setScreenshots(JSON.parse((merged["download.screenshots"] as string) || "[]")); } catch { setScreenshots([]); }
      try { setFeatures(JSON.parse((merged["download.features"] as string) || "[]")); }    catch { setFeatures(DEFAULT_FEATURES); }
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const set = <K extends keyof SiteSettings>(key: K, val: SiteSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: val }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setToast(null);
    try {
      await saveAdminSettings(token, {
        ...settings,
        "download.screenshots": JSON.stringify(screenshots),
        "download.features":    JSON.stringify(features),
      } as Partial<SiteSettings>);
      setToast({ type: "ok", msg: "Download page saved successfully." });
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "Failed to save." });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Download className="w-6 h-6 text-zinc-400" />
            Download Page
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage the public app download page at{" "}
            <a href="/download" target="_blank" className="text-red-400 hover:text-red-300 underline">/download</a>
          </p>
        </div>
        <a
          href="/download"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </a>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
          toast.type === "ok"
            ? "bg-green-900/20 border-green-500/30 text-green-400"
            : "bg-red-900/20 border-red-500/30 text-red-400"
        }`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* Visibility */}
        <Section title="Page Visibility" icon={Eye} color="bg-zinc-500/15 text-zinc-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Show Download Page</p>
              <p className="text-xs text-zinc-500 mt-0.5">When disabled the /download route returns 404.</p>
            </div>
            <Toggle
              checked={!!settings["download.show_page"]}
              onChange={(v) => set("download.show_page", v)}
              label="Show download page"
            />
          </div>
        </Section>

        {/* Hero text */}
        <Section title="Hero Text" icon={Type} color="bg-blue-500/15 text-blue-400">
          <Field label="Headline" hint="Large title shown at the top of the page.">
            <TextInput
              value={settings["download.headline"] as string ?? ""}
              onChange={(v) => set("download.headline", v)}
              placeholder="Watch Movies & TV Shows Anywhere"
            />
          </Field>
          <Field label="Sub-headline" hint="Supporting text below the headline.">
            <TextareaInput
              value={settings["download.subheadline"] as string ?? ""}
              onChange={(v) => set("download.subheadline", v)}
              placeholder="Stream thousands of titles on your Android device..."
              rows={3}
            />
          </Field>
        </Section>

        {/* Download links */}
        <Section title="Download Links" icon={Link} color="bg-green-500/15 text-green-400">
          <p className="text-xs text-zinc-500 -mt-1">Leave blank to hide that button.</p>
          <Field label="Google Play Store URL">
            <TextInput
              value={settings["download.badge_google_play"] as string ?? ""}
              onChange={(v) => set("download.badge_google_play", v)}
              placeholder="https://play.google.com/store/apps/details?id=..."
              mono
            />
          </Field>
          <Field label="Direct APK Download URL">
            <TextInput
              value={settings["download.badge_direct"] as string ?? ""}
              onChange={(v) => set("download.badge_direct", v)}
              placeholder="https://example.com/flixworld.apk"
              mono
            />
          </Field>
          <Field label="APKPure URL">
            <TextInput
              value={settings["download.badge_apkpure"] as string ?? ""}
              onChange={(v) => set("download.badge_apkpure", v)}
              placeholder="https://apkpure.com/..."
              mono
            />
          </Field>
          <Field label="Uptodown URL">
            <TextInput
              value={settings["download.badge_uptodown"] as string ?? ""}
              onChange={(v) => set("download.badge_uptodown", v)}
              placeholder="https://flixworld.en.uptodown.com/..."
              mono
            />
          </Field>
        </Section>

        {/* Screenshots */}
        <Section title="App Screenshots" icon={Image} color="bg-purple-500/15 text-purple-400">
          <p className="text-xs text-zinc-500 -mt-1">
            Screenshots displayed in the carousel. Use direct image URLs (CDN, Imgur, etc.).
          </p>
          <ScreenshotEditor value={screenshots} onChange={setScreenshots} />
        </Section>

        {/* Features */}
        <Section title="Feature Highlights" icon={Star} color="bg-yellow-500/15 text-yellow-400">
          <p className="text-xs text-zinc-500 -mt-1">Key selling points shown in the feature grid.</p>
          <FeatureEditor value={features} onChange={setFeatures} />
        </Section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>
    </div>
  );
}
