"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import type { StreamResponse, StreamServer } from "@/types/stream";
import { useAuth } from "@/hooks/useAuth";
import { getTitleProgressApi } from "@/lib/watch-api";
import { clientApiHeaders } from "@/lib/client-fetch";
import { STREAM_TOKEN_HEADER } from "@/lib/stream-token";

// React.lazy ensures the module is NEVER bundled into the server-rendered
// output. Combined with the `mounted` gate below (which returns null on the
// first server-side pass), vidstack code never runs until the browser is ready.
const PlayerInner = lazy(() => import("./player-inner"));

// ─── Placeholder shown while loading or on error ──────────────────────────────
function PlayerShell({
  label,
  spinner = false,
  onRetry,
}: {
  label: string;
  spinner?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="w-full aspect-video bg-zinc-950 flex items-center justify-center rounded-xl border border-white/5">
      <div className="flex flex-col items-center gap-3 text-zinc-500 text-sm text-center px-6">
        {spinner && (
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
        )}
        <span>{label}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 text-xs text-zinc-400 hover:text-white border border-white/10 rounded-md px-3 py-1.5 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Server picker ────────────────────────────────────────────────────────────
function ServerPicker({
  servers,
  activeId,
  onChange,
}: {
  servers: StreamServer[];
  activeId: string;
  onChange: (server: StreamServer) => void;
}) {
  if (servers.length <= 1) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap mb-2">
      <span className="text-xs text-zinc-500 shrink-0">Server</span>
      {servers.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s)}
          className={[
            "text-xs px-3 py-1 rounded-full border transition-colors",
            s.id === activeId
              ? "bg-red-600 border-red-500 text-white"
              : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/30",
          ].join(" ")}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
interface VidstackPlayerProps {
  streamApiUrl: string;
  title: string;
  posterUrl?: string | null;
  /** Short-lived HMAC token from the server — gates the stream proxy route */
  streamToken?: string;
  /** Called when the video finishes playing — use for auto-play next episode */
  onEnded?: () => void;
  /** When provided, enables watch-count increment + progress saving */
  tracking?: {
    type: "movie" | "tv";
    tmdbId: number;
    posterPath?: string | null;
    voteAverage?: number | string | null;
    releaseDate?: string | null;
    season?: number;
    episode?: number;
  };
  /** Sync callbacks for co-watch features (no-op if unused) */
  onPartyPlay?: (currentTime: number) => void;
  onPartyPause?: (currentTime: number) => void;
  onPartySeek?: (currentTime: number) => void;
  registerPlayerControls?: (controls: import("./player-inner").PlayerControls) => void;
}

export default function VidstackPlayer(props: VidstackPlayerProps) {
  // vidstack module is never evaluated server-side — even with Turbopack.
  const [mounted, setMounted] = useState(false);
  const [streamData, setStreamData] = useState<StreamResponse | null>(null);
  const [resumePosition, setResumePosition] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [activeServer, setActiveServer] = useState<StreamServer | null>(null);
  const { token } = useAuth();

  // Step 1: mark as mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 2: fetch stream + progress in parallel once mounted
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setStreamData(null);
    setResumePosition(0);
    setActiveServer(null);

    const streamFetch = fetch(props.streamApiUrl, {
        headers: clientApiHeaders(
          props.streamToken ? { [STREAM_TOKEN_HEADER]: props.streamToken } : undefined,
        ),
      })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<StreamResponse>;
      })
      .then((data) => {
        if (!data?.data?.stream_urls?.length) {
          throw new Error("No stream URLs returned");
        }
        return data;
      });

    // Fetch saved progress in parallel — only if we have a token and tracking info
    const progressFetch: Promise<number> =
      token && props.tracking
        ? getTitleProgressApi(token, props.tracking.type, props.tracking.tmdbId)
            .then((record) => {
              if (!record || record.position_seconds < 10) return 0;
              // Don't resume if >95% complete
              const pct =
                record.duration_seconds > 0
                  ? record.position_seconds / record.duration_seconds
                  : 0;
              if (pct >= 0.95) return 0;
              return record.position_seconds;
            })
            .catch(() => 0)
        : Promise.resolve(0);

    Promise.all([streamFetch, progressFetch])
      .then(([data, position]) => {
        if (!cancelled) {
          setStreamData(data);
          setResumePosition(position);
          // Default to Server 1 (primary) if available
          const primary = data.servers?.find((s) => s.id === "primary") ?? data.servers?.[0] ?? null;
          setActiveServer(primary);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load stream");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, props.streamApiUrl, retryCount]);

  // Server render & first hydration pass — return plain placeholder with no
  // vidstack code referenced anywhere in this render path
  if (!mounted) {
    return <PlayerShell label="" />;
  }

  if (loading) {
    return <PlayerShell label="Loading stream…" spinner />;
  }

  if (error || !streamData) {
    return (
      <PlayerShell
        label={error ?? "Stream unavailable"}
        onRetry={() => setRetryCount((c) => c + 1)}
      />
    );
  }

  // Only reached in the browser after mount + successful fetch.
  // React.lazy + Suspense loads player-inner.tsx on demand.
  const servers = streamData.servers ?? [];
  const isOverride = activeServer && activeServer.id !== "primary";

  return (
    <div className="w-full">
      <Suspense fallback={<PlayerShell label="Loading player…" spinner />}>
        <PlayerInner
          key={activeServer?.id ?? "primary"}
          streamData={streamData}
          title={props.title}
          posterUrl={props.posterUrl}
          resumePosition={resumePosition}
          onEnded={props.onEnded}
          tracking={
            props.tracking
              ? { ...props.tracking, title: props.title }
              : undefined
          }
          onPartyPlay={props.onPartyPlay}
          onPartyPause={props.onPartyPause}
          onPartySeek={props.onPartySeek}
          registerPlayerControls={props.registerPlayerControls}
          srcOverride={isOverride ? activeServer.url : null}
          srcOverrideType={
            isOverride
              ? activeServer.type === "hls"
                ? "application/x-mpegurl"
                : "video/mp4"
              : undefined
          }
        />
      </Suspense>
      <ServerPicker
        servers={servers}
        activeId={activeServer?.id ?? "primary"}
        onChange={setActiveServer}
      />
    </div>
  );
}
