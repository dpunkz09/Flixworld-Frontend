/**
 * Client-side fetch wrapper that injects X-API-Key on every request.
 * Uses NEXT_PUBLIC_API_CLIENT_KEY — safe for the browser bundle.
 * Import this in client-side API libs (auth-api, watch-api, etc.).
 */
export function clientApiHeaders(extra?: HeadersInit): HeadersInit {
  const key = process.env.NEXT_PUBLIC_API_CLIENT_KEY ?? "";
  return {
    ...(key ? { "X-API-Key": key } : {}),
    ...(extra as Record<string, string> | undefined),
  };
}
