import { NextRequest, NextResponse } from "next/server";
import { CACHE_SUBTITLE_MAX_AGE, CACHE_HLS_SEGMENT_MAX_AGE } from "@/lib/cache-config";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// 120 HLS segment requests per minute per IP — enough for normal playback
// (a 6s segment cadence = 10/min; 120 gives headroom for multiple quality levels)
// without allowing the proxy to be abused as an open relay.
const limiter = createRateLimiter({ windowMs: 60_000, max: 120 });

const BINARY_EXTS = new Set(["ts", "aac", "mp4", "m4s", "m4v", "m4a", "fmp4"]);
const CONTENT_TYPES: Record<string, string> = {
  ts: "video/mp2t",
  aac: "audio/aac",
  mp4: "video/mp4",
  m4s: "video/mp4",
  m4v: "video/mp4",
  m4a: "audio/mp4",
  fmp4: "video/mp4",
  m3u8: "application/x-mpegurl",
  vtt: "text/vtt",
  srt: "text/vtt",
};

/** Convert SubRip (.srt) text to WebVTT so browsers can render it natively */
function srtToVtt(srt: string): string {
  return (
    "WEBVTT\n\n" +
    srt
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Replace SRT timestamps (00:00:00,000) with VTT (00:00:00.000)
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
      .trim()
  );
}

/** Rewrite all URIs inside an m3u8 so they go through this proxy */
function rewriteM3u8(text: string, baseUrl: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) return line;

      // Rewrite URI="..." inside EXT tags (key, map, media)
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          const abs = toAbsolute(uri, baseUrl);
          return `URI="/api/hls-proxy?url=${encodeURIComponent(abs)}"`;
        });
      }

      // Segment / sub-playlist lines
      const abs = toAbsolute(trimmed, baseUrl);
      return `/api/hls-proxy?url=${encodeURIComponent(abs)}`;
    })
    .join("\n");
}

function toAbsolute(uri: string, base: string): string {
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  try {
    return new URL(uri, base).href;
  } catch {
    return uri;
  }
}

export async function GET(request: NextRequest) {
  // Rate-limit to prevent the proxy being used as an open relay
  const ip = getClientIp(request);
  const rl = limiter.check(ip);
  if (!rl.allowed) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  const target = request.nextUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(target);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Referer: `${parsedUrl.origin}/`,
        Origin: parsedUrl.origin,
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const upstreamCt = upstream.headers.get("content-type") ?? "";
    const ext = parsedUrl.pathname.split(".").pop()?.split("?")[0].toLowerCase() ?? "";

    const isSrt = ext === "srt" || upstreamCt.includes("subrip");
    const isM3u8 =
      ext === "m3u8" ||
      upstreamCt.includes("mpegurl") ||
      upstreamCt.includes("x-mpegurl");
    const isVtt = ext === "vtt" || upstreamCt.includes("vtt");
    const isBinary = BINARY_EXTS.has(ext);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    };

    // ── SRT subtitle → convert to VTT ─────────────────────────────────────
    if (isSrt || isVtt) {
      const text = await upstream.text();
      const vtt = isSrt ? srtToVtt(text) : text;
      return new NextResponse(vtt, {
        headers: {
          "Content-Type": "text/vtt; charset=utf-8",
          "Cache-Control": `public, max-age=${CACHE_SUBTITLE_MAX_AGE}`,
          ...corsHeaders,
        },
      });
    }

    // ── M3U8 playlist → rewrite URIs ───────────────────────────────────────
    if (isM3u8) {
      const text = await upstream.text();
      const rewritten = rewriteM3u8(text, target);
      return new NextResponse(rewritten, {
        headers: {
          "Content-Type": "application/x-mpegurl; charset=utf-8",
          "Cache-Control": "no-store",
          ...corsHeaders,
        },
      });
    }

    // ── Binary segments — stream directly, no buffering ───────────────────────
    // Forward Content-Length so the Node.js HTTP layer knows the response size
    // upfront and can pipe bytes through without accumulating them in the heap.
    if (isBinary) {
      const contentLength = upstream.headers.get("content-length");
      const binaryHeaders: Record<string, string> = {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": `public, max-age=${CACHE_HLS_SEGMENT_MAX_AGE}`,
        ...corsHeaders,
      };
      if (contentLength) binaryHeaders["Content-Length"] = contentLength;
      return new NextResponse(upstream.body, { headers: binaryHeaders });
    }

    // ── Fallback: stream as-is ─────────────────────────────────────────────
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstreamCt || "application/octet-stream",
        "Cache-Control": "no-store",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[hls-proxy]", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
