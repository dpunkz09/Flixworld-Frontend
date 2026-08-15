"use client";

import { useEffect, useState, useCallback, type FormEvent, type ReactNode } from "react";
import {
  Settings, Save, Loader2, CheckCircle2, AlertCircle,
  BarChart2, Megaphone, Play, Database, Key, Eye, EyeOff,
  Smartphone,
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

function TextInput({
  value, onChange, placeholder, mono = false, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-zinc-800 border border-white/10 focus:border-white/30 text-white placeholder-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${mono ? "font-mono" : ""}`}
    />
  );
}

function TextareaInput({
  value, onChange, placeholder, rows = 3,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-zinc-800 border border-white/10 focus:border-white/30 text-white placeholder-zinc-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-colors resize-y"
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
      <span
        className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transform transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function NumberInput({ value, onChange, min, max, placeholder }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      className="w-full bg-zinc-800 border border-white/10 focus:border-white/30 text-white placeholder-zinc-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-colors"
    />
  );
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-white/10 focus:border-white/30 text-white placeholder-zinc-600 rounded-lg px-3 py-2 pr-9 text-sm font-mono focus:outline-none transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// -- Default empty settings ----------------------------------------------------

const EMPTY: SiteSettings = {
  "analytics.code": "",
  "adsense.code": "",
  "player.hls_proxy": "/api/hls-proxy?url=",
  "redis.enabled": false,
  "redis.host": "localhost",
  "redis.port": 6379,
  "redis.password": "",
  "redis.db": 0,
  "tmdb.api_key": "",
  "app.android.version_code": 1,
  "app.android.version_name": "1.0",
  "app.android.apk_url": "",
  "download.show_page": true,
  "download.headline": "Watch Movies & TV Shows Anywhere",
  "download.subheadline": "Stream thousands of titles on your Android device. Download the FlixWorld app for free.",
  "download.badge_google_play": "",
  "download.badge_direct": "",
  "download.badge_apkpure": "",
  "download.badge_uptodown": "",
  "download.screenshots": "[]",
  "download.features": "[]",
};

// -- Page ----------------------------------------------------------------------

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getAdminSettings(token);
      setSettings({ ...EMPTY, ...data });
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
      await saveAdminSettings(token, settings);
      setToast({ type: "ok", msg: "Settings saved successfully." });
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "Failed to save settings." });
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
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-zinc-400" />
          Site Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Changes take effect on the next server restart for environment-level settings.
          DB-backed settings apply immediately.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
          toast.type === "ok"
            ? "bg-green-900/20 border-green-500/30 text-green-400"
            : "bg-red-900/20 border-red-500/30 text-red-400"
        }`}>
          {toast.type === "ok"
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* Analytics */}
        <Section title="Analytics" icon={BarChart2} color="bg-blue-500/15 text-blue-400">
          <Field
            label="Analytics Script Code"
            hint="Paste the full <script> tag from Google Analytics, Plausible, or any other provider."
          >
            <TextareaInput
              value={settings["analytics.code"]}
              onChange={(v) => set("analytics.code", v)}
              placeholder="<script async src='...'></script>"
              rows={4}
            />
          </Field>
        </Section>

        {/* AdSense */}
        <Section title="Google AdSense" icon={Megaphone} color="bg-yellow-500/15 text-yellow-400">
          <Field
            label="AdSense Script Code"
            hint="Paste your AdSense <script> snippet. Leave empty to disable ads."
          >
            <TextareaInput
              value={settings["adsense.code"]}
              onChange={(v) => set("adsense.code", v)}
              placeholder="<script async src='https://pagead2.googlesyndication.com/...'></script>"
              rows={4}
            />
          </Field>
        </Section>

        {/* Video Player */}
        <Section title="Video Player" icon={Play} color="bg-green-500/15 text-green-400">
          <Field
            label="HLS Proxy URL"
            hint="Used to proxy HLS streams for CORS. Must end with the URL param, e.g. ?url="
          >
            <TextInput
              value={settings["player.hls_proxy"]}
              onChange={(v) => set("player.hls_proxy", v)}
              placeholder="https://proxy.example.com/api?url="
              mono
            />
          </Field>
        </Section>

        {/* Redis */}
        <Section title="Redis Cache" icon={Database} color="bg-orange-500/15 text-orange-400">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-white">Enable Redis</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                When disabled, an in-memory cache is used instead.
              </p>
            </div>
            <Toggle
              checked={settings["redis.enabled"]}
              onChange={(v) => set("redis.enabled", v)}
              label="Enable Redis"
            />
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${settings["redis.enabled"] ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <Field label="Host">
              <TextInput value={settings["redis.host"]} onChange={(v) => set("redis.host", v)} placeholder="localhost" mono />
            </Field>
            <Field label="Port">
              <NumberInput value={settings["redis.port"]} onChange={(v) => set("redis.port", v)} min={1} max={65535} placeholder="6379" />
            </Field>
            <Field label="Password" hint="Leave empty if no auth is required.">
              <PasswordInput value={settings["redis.password"]} onChange={(v) => set("redis.password", v)} placeholder="optional" />
            </Field>
            <Field label="Database Index">
              <NumberInput value={settings["redis.db"]} onChange={(v) => set("redis.db", v)} min={0} max={15} placeholder="0" />
            </Field>
          </div>
        </Section>

        {/* TMDB */}
        <Section title="TMDB API" icon={Key} color="bg-purple-500/15 text-purple-400">
          <Field
            label="TMDB API Key"
            hint="Get your free API key from https://www.themoviedb.org/settings/api. Changes require a server restart."
          >
            <PasswordInput
              value={settings["tmdb.api_key"]}
              onChange={(v) => set("tmdb.api_key", v)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </Field>
        </Section>

        {/* Android App Version */}
        <Section title="Android App Version" icon={Smartphone} color="bg-green-500/15 text-green-400">
          <p className="text-xs text-zinc-500 -mt-1 mb-2">
            Set the minimum required version. Android clients below this version code are
            blocked and shown a forced-update screen with the APK download link.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Minimum Version Code"
              hint="Integer matching versionCode in build.gradle.kts. Clients with a lower code are blocked."
            >
              <NumberInput
                value={settings["app.android.version_code"]}
                onChange={(v) => set("app.android.version_code", v)}
                min={1}
                placeholder="1"
              />
            </Field>
            <Field
              label="Minimum Version Name"
              hint="Human-readable label shown on the update screen (e.g. 1.1)."
            >
              <TextInput
                value={settings["app.android.version_name"]}
                onChange={(v) => set("app.android.version_name", v)}
                placeholder="1.0"
              />
            </Field>
          </div>
          <Field
            label="APK Download URL"
            hint="Direct link to the latest APK. Shown as the download button on the forced-update screen."
          >
            <TextInput
              value={settings["app.android.apk_url"]}
              onChange={(v) => set("app.android.apk_url", v)}
              placeholder="https://example.com/flixworld-latest.apk"
              mono
            />
          </Field>
        </Section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

      </form>
    </div>
  );
}
