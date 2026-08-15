import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches a WebVTT thumbnail sprite file and rewrites all relative image
 * paths inside it to absolute URLs so the browser can load them.
 *
 * The VTT from vidapi.cloud looks like:
 *   /static/i0ie/.../img1.jpg#xywh=0,0,160,67
 *
 * We resolve those relative paths against the VTT file's origin so vidstack
 * can display seek-bar thumbnail previews correctly.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return new NextResponse(`Upstream ${res.status}`, { status: res.status });
    }

    const vttText = await res.text();
    const origin = parsedUrl.origin; // e.g. https://vidapi.cloud

    // Rewrite every line that looks like an image reference.
    // Lines can be:
    //   /static/.../img1.jpg#xywh=0,0,160,67   (absolute path, relative origin)
    //   img1.jpg#xywh=0,0,160,67               (relative path)
    //   https://...jpg#xywh=0,0,160,67          (already absolute — leave as-is)
    const rewritten = vttText
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();

        // Skip blank lines, WEBVTT header, cue timestamps (contain " --> ")
        if (
          !trimmed ||
          trimmed === "WEBVTT" ||
          trimmed.includes(" --> ") ||
          trimmed.startsWith("NOTE")
        ) {
          return line;
        }

        // Already absolute — leave unchanged
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          return line;
        }

        // Relative or root-relative — resolve against origin
        try {
          const absolute = new URL(trimmed, origin).href;
          return absolute;
        } catch {
          return line;
        }
      })
      .join("\n");

    return new NextResponse(rewritten, {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        // Cache for an hour — thumbnail sprites don't change
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[thumbnails-proxy]", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
