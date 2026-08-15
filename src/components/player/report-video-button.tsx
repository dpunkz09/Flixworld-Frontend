"use client";

import { useState } from "react";
import { Flag, X, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { submitVideoReport } from "@/lib/admin-api";

const REASONS = [
  { value: "not_working",    label: "Video not working / broken" },
  { value: "wrong_content",  label: "Wrong content / wrong movie" },
  { value: "low_quality",    label: "Poor video or audio quality" },
  { value: "no_subtitles",   label: "Subtitles missing or wrong" },
  { value: "other",          label: "Other issue" },
];

interface ReportVideoButtonProps {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
}

export default function ReportVideoButton({ type, tmdbId, title }: ReportVideoButtonProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Not logged in -- still show the button but prompt to log in
  const handleOpen = () => {
    if (!token) {
      alert("Please sign in to report a video.");
      return;
    }
    setOpen(true);
    setStatus("idle");
    setReason("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reason) return;

    setStatus("loading");
    try {
      await submitVideoReport(token, { type, tmdb_id: tmdbId, title, reason, notes: notes.trim() || undefined });
      setStatus("success");
      setTimeout(() => setOpen(false), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit report");
    }
  };

  return (
    <>
      {/* Report button */}
      <button
        onClick={handleOpen}
        title="Report an issue with this video"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors border border-white/10 hover:border-red-500/30 rounded-lg px-3 py-1.5 bg-zinc-900/50 hover:bg-red-500/10"
      >
        <Flag className="w-3.5 h-3.5" />
        Report Issue
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-white">Report an Issue</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            {status === "success" ? (
              <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
                <p className="text-white font-medium">Report submitted</p>
                <p className="text-xs text-zinc-500">Thank you -- we&apos;ll review this soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Title</p>
                  <p className="text-sm text-zinc-300 truncate font-medium">{title}</p>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-400">What&apos;s the issue? *</p>
                  {REASONS.map((r) => (
                    <label key={r.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      reason === r.value
                        ? "border-red-500/50 bg-red-600/10 text-white"
                        : "border-white/5 bg-zinc-800/50 text-zinc-400 hover:border-white/10 hover:text-zinc-300"
                    }`}>
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="sr-only"
                      />
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                        reason === r.value ? "border-red-500 bg-red-500" : "border-zinc-600"
                      }`} />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Describe the issue..."
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={!reason || status === "loading"}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
                    {status === "loading" ? "Submitting..." : "Submit Report"}
                  </button>
                  <button type="button" onClick={() => setOpen(false)}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-white/10">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
