// ============================================================
// In-memory per-user rate limiter
// NOTE: This is process-local. If the app runs on multiple
// instances (e.g. Vercel serverless scale-out), each instance
// has its own store — effective for casual abuse prevention,
// not a hard guarantee. For strict limits, use Redis/Upstash.
// ============================================================

interface BucketEntry {
  count: number;
  resetAt: number;
}

// Module-level store persists across requests in the same process
const store = new Map<string, BucketEntry>();

// Periodically purge expired entries to prevent unbounded growth.
// Runs every 5 minutes; only active in long-lived server processes.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number };

/**
 * Check whether `key` is within the allowed `limit` per `windowMs`.
 * Mutates the store on every allowed call.
 *
 * @param key       Unique identifier (e.g. `userId:endpoint`)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}
