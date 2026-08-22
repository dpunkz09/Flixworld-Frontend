"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Subtitles,
  X,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdminSubtitles,
  uploadAdminSubtitle,
  deleteAdminSubtitle,
  type CustomSubtitle,
  type Paginated,
} from "@/lib/admin-api";

// ── Language options ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
  { code: "pl", label: "Polish" },
  { code: "nl", label: "Dutch" },
];

// ── Upload form ───────────────────────────────────────────────────────────────
function UploadForm({
  token,
  onSaved,
}: {
  token: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "movie",
    tmdb_id: "",
    season: "",
    episode: "",
    language: "en",
    label: "English",
    file: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill label when language changes
  const handleLanguageChange = (code: string) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    setForm((f) => ({
      ...f,
      language: code,
      label: lang?.label ?? code.toUpperCase(),
    }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((f) => ({ ...f, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.file) { setError("Please select a subtitle file."); return; }
    if (!form.tmdb_id) { setError("TMDB ID is required."); return; }

    setLoading(true);
    try {
      await uploadAdminSubtitle(token, {
        type: form.type,
        tmdb_id: Number(form.tmdb_id),
        season: form.season ? Number(form.season) : null,
        episode: form.episode ? Number(form.episode) : null,
        language: form.language,
        label: form.label,
        file: form.file,
      });
      setForm({
        type: "movie",
        tmdb_id: "",
        season: "",
        episode: "",
        language: "en",
        label: "English",
        file: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Upload className="w-4 h-4" /> Upload Subtitle
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-white/10 rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Upload Subtitle</h3>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="p-1 rounded text-zinc-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Type + TMDB ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Type</label>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value, season: "", episode: "" }))
            }
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">TMDB ID *</label>
          <input
            required
            type="number"
            min="1"
            value={form.tmdb_id}
            onChange={(e) => setForm((f) => ({ ...f, tmdb_id: e.target.value }))}
            placeholder="e.g. 550"
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Season + Episode (TV only) */}
      {form.type === "tv" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Season{" "}
              <span className="text-zinc-600">(leave blank = all seasons)</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.season}
              onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
              placeholder="e.g. 1"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Episode{" "}
              <span className="text-zinc-600">(leave blank = all episodes)</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.episode}
              onChange={(e) => setForm((f) => ({ ...f, episode: e.target.value }))}
              placeholder="e.g. 1"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      )}

      {/* Language + Label */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Language *</label>
          <select
            value={form.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} ({l.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Label{" "}
            <span className="text-zinc-600">(shown in player)</span>
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="e.g. English"
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* File picker */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">
          Subtitle File *{" "}
          <span className="text-zinc-600">(.vtt, .srt, .ass — max 5 MB)</span>
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".vtt,.srt,.ass,.ssa"
            onChange={handleFile}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-zinc-700 file:text-zinc-300 hover:file:bg-zinc-600 cursor-pointer"
          />
        </div>
        {form.file && (
          <p className="text-xs text-zinc-500 mt-1 truncate">
            Selected: {form.file.name} ({(form.file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" /> Upload
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({
  filterType,
  filterTmdbId,
  onFilterType,
  onFilterTmdbId,
  onApply,
  onClear,
}: {
  filterType: string;
  filterTmdbId: string;
  onFilterType: (v: string) => void;
  onFilterTmdbId: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 bg-zinc-900 border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
        <Filter className="w-3.5 h-3.5" /> Filter
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Type</label>
        <select
          value={filterType}
          onChange={(e) => onFilterType(e.target.value)}
          className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All</option>
          <option value="movie">Movie</option>
          <option value="tv">TV Show</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">TMDB ID</label>
        <input
          type="number"
          value={filterTmdbId}
          onChange={(e) => onFilterTmdbId(e.target.value)}
          placeholder="e.g. 550"
          className="w-32 bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
          onKeyDown={(e) => { if (e.key === "Enter") onApply(); }}
        />
      </div>
      <button
        onClick={onApply}
        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
      >
        Apply
      </button>
      {(filterType || filterTmdbId) && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-zinc-500 hover:text-white text-sm rounded-lg transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── Subtitle row ──────────────────────────────────────────────────────────────
function SubtitleRow({
  subtitle,
  onDelete,
  deleting,
}: {
  subtitle: CustomSubtitle;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const episodeLabel =
    subtitle.type === "tv"
      ? subtitle.season != null
        ? subtitle.episode != null
          ? `S${subtitle.season}E${subtitle.episode}`
          : `Season ${subtitle.season}`
        : "All episodes"
      : null;

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-zinc-800 text-zinc-400 rounded px-1.5 py-0.5 capitalize">
              {subtitle.type}
            </span>
            <span className="text-xs text-zinc-500">#{subtitle.tmdb_id}</span>
            {episodeLabel && (
              <span className="text-xs bg-zinc-800 text-blue-400 rounded px-1.5 py-0.5">
                {episodeLabel}
              </span>
            )}
            <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5 font-mono uppercase">
              {subtitle.language}
            </span>
            <span className="text-sm font-medium text-white">{subtitle.label}</span>
            {!subtitle.active && (
              <span className="text-xs bg-zinc-700 text-zinc-400 rounded px-1.5 py-0.5">
                Inactive
              </span>
            )}
          </div>

          {/* File info */}
          {subtitle.original_filename && (
            <p className="text-xs text-zinc-500 font-mono truncate">
              {subtitle.original_filename}
            </p>
          )}

          {/* Public URL preview */}
          <a
            href={subtitle.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-600 hover:text-zinc-400 font-mono truncate block transition-colors"
          >
            {subtitle.public_url}
          </a>

          <p className="text-xs text-zinc-600">
            Uploaded {new Date(subtitle.created_at).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={() => onDelete(subtitle.id)}
          disabled={deleting}
          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40 flex-shrink-0"
          title="Delete subtitle"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminSubtitlesPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<Paginated<CustomSubtitle> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterTmdbId, setFilterTmdbId] = useState("");
  const [appliedType, setAppliedType] = useState<string | undefined>(undefined);
  const [appliedTmdbId, setAppliedTmdbId] = useState<number | undefined>(undefined);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminSubtitles(token, page, appliedType, appliedTmdbId)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, appliedType, appliedTmdbId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApplyFilter = () => {
    setPage(1);
    setAppliedType(filterType || undefined);
    setAppliedTmdbId(filterTmdbId ? Number(filterTmdbId) : undefined);
  };

  const handleClearFilter = () => {
    setFilterType("");
    setFilterTmdbId("");
    setPage(1);
    setAppliedType(undefined);
    setAppliedTmdbId(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete this subtitle? It will also be removed from storage.")) return;
    setDeletingId(id);
    try {
      await deleteAdminSubtitle(token, id);
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Subtitles</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Upload subtitles per TMDB title — loaded in the player before Wyzie
            provider &middot;{" "}
            <span className="text-zinc-400">{result?.meta.total ?? 0} entries</span>
          </p>
        </div>
        {token && <UploadForm token={token} onSaved={() => { setPage(1); load(); }} />}
      </div>

      {/* Filter bar */}
      <FilterBar
        filterType={filterType}
        filterTmdbId={filterTmdbId}
        onFilterType={setFilterType}
        onFilterTmdbId={setFilterTmdbId}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />
          ))
        ) : result?.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-500 text-sm bg-zinc-900 border border-white/5 rounded-xl">
            <Subtitles className="w-8 h-8 text-zinc-700" />
            <span>No custom subtitles yet. Upload one above.</span>
          </div>
        ) : (
          result?.data.map((s) => (
            <SubtitleRow
              key={s.id}
              subtitle={s}
              onDelete={handleDelete}
              deleting={deletingId === s.id}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {result && result.meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Page {page} of {result.meta.last_page}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(result.meta.last_page, p + 1))}
              disabled={page === result.meta.last_page}
              className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
