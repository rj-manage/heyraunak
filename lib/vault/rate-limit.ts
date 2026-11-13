// Small in-memory fixed-window limiter. Per-instance only - it complements the
// durable counters held on the handover row (failed_attempts/locked_until) and
// the event-derived OTP counters, which are the real backstop.

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  now?: () => number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max } = options;
  const now = options.now ?? (() => Date.now());
  const hits = new Map<string, number[]>();

  return function check(key: string): RateLimitResult {
    const t = now();
    const recent = (hits.get(key) || []).filter((ts) => t - ts < windowMs);

    if (recent.length >= max) {
      const oldest = recent[0];
      hits.set(key, recent);
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (t - oldest)) / 1000)) };
    }

    recent.push(t);
    hits.set(key, recent);

    // keep the map from growing without bound on a long-lived instance
    if (hits.size > 5000) hits.clear();

    return { ok: true, retryAfterSeconds: 0 };
  };
}
