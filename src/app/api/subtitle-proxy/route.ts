import { NextRequest, NextResponse } from "next/server";
import { CACHE_SUBTITLE_MAX_AGE } from "@/lib/cache-config";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Route subtitle fetches through the Cloudflare Worker which can reach
// OpenSubtitles without being blocked (Vercel datacenter IPs get 403).
// The worker also handles SRT→VTT conversion, so we just forward as-is.
const CF_WORKER = "https://proxy.jpaworx.com";

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Bad protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Forward to Cloudflare Worker — it handles OpenSubtitles headers,
    // SRT→VTT conversion, and returns text/vtt already.
    const workerUrl = `${CF_WORKER}/?url=${encodeURIComponent(target)}`;
    const upstream = await fetch(workerUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream returned ${upstream.status}`, {
        status: upstream.status,
        headers: CORS,
      });
    }

    const text = await upstream.text();

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": `public, max-age=${CACHE_SUBTITLE_MAX_AGE}, immutable`,
        ...CORS,
      },
    });
  } catch (err) {
    console.error("[subtitle-proxy]", err);
    return new NextResponse("Proxy error", { status: 502, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...CORS,
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
