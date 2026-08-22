/**
 * Simple in-memory sliding-window rate limiter for Next.js API routes.
 * No external dependencies - uses a module-level Map that persists across
 * requests in the same Node.js process/worker.
 */

interface HitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export function createRateLimiter(opts: {
  /** Window length in milliseconds */
  windowMs: number;
  /** Max requests per key per window */
  max: number;
}): RateLimiter {
  const store = new Map<string, HitRecord>();

  // Periodically clean up expired entries to prevent memory leak
  const cleanup = () => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) store.delete(key);
    }
  };

  // Only register interval in server context (not during SSR module eval)
  if (typeof setInterval !== "undefined") {
    setInterval(cleanup, opts.windowMs * 2).unref?.();
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();

      // Hard size cap: if the Map grows beyond 50 000 entries (e.g. from
      // rotating-IP attacks), run cleanup immediately. If still over the
      // limit after pruning expired entries, reject the request to protect
      // server memory — this is a degraded-mode safety valve, not normal
      // operation.
      if (store.size >= 50_000) {
        cleanup();
        if (store.size >= 50_000) {
          return { allowed: false, remaining: 0, resetAt: now + opts.windowMs };
        }
      }

      const existing = store.get(key);

      if (!existing || existing.resetAt <= now) {
        const record: HitRecord = { count: 1, resetAt: now + opts.windowMs };
        store.set(key, record);
        return { allowed: true, remaining: opts.max - 1, resetAt: record.resetAt };
      }

      existing.count += 1;
      return {
        allowed: existing.count <= opts.max,
        remaining: Math.max(0, opts.max - existing.count),
        resetAt: existing.resetAt,
      };
    },
  };
}

/**
 * Extract the real client IP from a Next.js request, respecting proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
