/**
 * Short-lived HMAC tokens for the stream proxy routes.
 *
 * Flow:
 *  1. Watch page (RSC) calls generateStreamToken() server-side and passes it
 *     as a prop to the client player component.
 *  2. VidstackPlayer includes the token in the /api/stream/... fetch header.
 *  3. The API route calls verifyStreamToken() — rejects requests without a
 *     valid token, making external scraping much harder.
 *
 * The secret is STREAM_PROXY_SECRET (server-only env var, never sent to browser).
 * Tokens expire after TOKEN_TTL_SECONDS. Signed payload: "type:id:issuedAt".
 */

const SECRET = process.env.STREAM_PROXY_SECRET ?? "";
const TOKEN_TTL_SECONDS = 3600; // 1 hour — long enough for a full movie
const HEADER = "x-stream-token";

// Export the header name so the client knows what to send
export { HEADER as STREAM_TOKEN_HEADER };

// Cache the imported CryptoKey so we don't re-import on every request
let _cachedKey: CryptoKey | null = null;

async function getHmacKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const enc = new TextEncoder();
  _cachedKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return _cachedKey;
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Buffer.from(sig).toString("hex");
}

/**
 * Generate a signed token. Call server-side only.
 * @param type  "movie" | "tv"
 * @param id    TMDB ID (number or string)
 */
export async function generateStreamToken(type: string, id: string | number): Promise<string> {
  if (!SECRET) return "dev"; // dev mode — no secret configured
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${type}:${id}:${issuedAt}`;
  const sig = await hmac(payload);
  // token = base64(payload) + "." + sig (first 16 hex chars)
  return Buffer.from(payload).toString("base64url") + "." + sig.slice(0, 32);
}

/**
 * Verify a token on the proxy API route.
 * Returns true if valid, false if missing/expired/tampered.
 */
export async function verifyStreamToken(token: string | null): Promise<boolean> {
  if (!SECRET) return true; // dev mode — skip verification
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  try {
    const payload = Buffer.from(parts[0], "base64url").toString("utf-8");
    const expectedSig = await hmac(payload);
    if (!expectedSig.startsWith(parts[1])) return false;

    // Check expiry
    const segments = payload.split(":");
    const issuedAt = parseInt(segments[segments.length - 1], 10);
    if (isNaN(issuedAt)) return false;

    const age = Math.floor(Date.now() / 1000) - issuedAt;
    return age <= TOKEN_TTL_SECONDS;
  } catch {
    return false;
  }
}
