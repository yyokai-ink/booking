/**
 * Fixed-window in-memory limiter. Good for a single Node process (dev, one container).
 * For multi-instance production swap the store for Redis behind the same `check` signature (Stage 4 task).
 */
export interface RateLimitResult { ok: boolean; remaining: number; retryAfterMs: number }

export function createRateLimiter(opts: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 };
      }
      entry.count += 1;
      const ok = entry.count <= opts.limit;
      return { ok, remaining: Math.max(0, opts.limit - entry.count), retryAfterMs: ok ? 0 : entry.resetAt - now };
    },
  };
}
