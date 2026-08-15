import { NextRequest, NextResponse } from "next/server";
import { CACHE_SUBTITLE_MAX_AGE } from "@/lib/cache-config";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

/** Convert SubRip (.srt) to WebVTT */
function srtToVtt(srt: string): string {
  const body = srt
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
    .trim();
  return `WEBVTT\n\n${body}`;
}

function isVtt(text: string): boolean {
  return text.trimStart().startsWith("WEBVTT");
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(target);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Bad protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        // Headers expected by OpenSubtitles download endpoints
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity", // avoid gzip so we get plain text
        Referer: "https://www.opensubtitles.org/",
        Origin: "https://www.opensubtitles.org",
      },
      // Follow redirects (default)
      redirect: "follow",
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream returned ${upstream.status}`, {
        status: upstream.status,
        headers: CORS,
      });
    }

    const text = await upstream.text();

    // Normalise to VTT regardless of whether the upstream gave SRT or VTT
    const vtt = isVtt(text) ? text : srtToVtt(text);

    return new NextResponse(vtt, {
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
