export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type RateLimiterOptions = {
  /** Max requests per key within the window. */
  limit: number;
  windowMs: number;
  /** Injectable clock for tests. */
  now?: () => number;
};

const MAX_TRACKED_KEYS = 10_000;

/**
 * Sliding-window limiter kept in memory. Good enough for a single instance;
 * with several instances the counters would have to live in Redis or Postgres.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly now: () => number;

  constructor(private readonly options: RateLimiterOptions) {
    this.now = options.now ?? Date.now;
  }

  check(key: string): RateLimitResult {
    const now = this.now();
    const { limit, windowMs } = this.options;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > now - windowMs);

    if (recent.length >= limit) {
      this.hits.set(key, recent);
      const retryAfterMs = recent[0] + windowMs - now;
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }

    recent.push(now);
    this.hits.set(key, recent);
    this.prune(now);
    return { allowed: true };
  }

  /** Keeps memory bounded: drop idle keys, then the oldest ones if still too many. */
  private prune(now: number) {
    if (this.hits.size <= MAX_TRACKED_KEYS) return;
    for (const [key, times] of this.hits) {
      if (times[times.length - 1] <= now - this.options.windowMs) this.hits.delete(key);
    }
    for (const key of this.hits.keys()) {
      if (this.hits.size <= MAX_TRACKED_KEYS) break;
      this.hits.delete(key);
    }
  }
}
