import { NextRequest, NextResponse } from "next/server";
import { getTvStream } from "@/lib/stream";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { verifyStreamToken, STREAM_TOKEN_HEADER } from "@/lib/stream-token";

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; season: string; episode: string }> },
) {
  // ── Rate limit ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = limiter.check(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // ── Token verification ──────────────────────────────────────────────────
  const token = req.headers.get(STREAM_TOKEN_HEADER);
  const valid = await verifyStreamToken(token);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or missing stream token." },
      { status: 401 },
    );
  }

  const { id, season, episode } = await params;
  try {
    const data = await getTvStream(id, season, episode);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  } catch (err) {
    console.error("[stream/tv]", err);
    return NextResponse.json({ error: "Stream unavailable" }, { status: 502 });
  }
}
