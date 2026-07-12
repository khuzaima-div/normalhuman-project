type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Simple in-process sliding-window rate limiter.
 * Suitable for single-instance dev/staging; replace with Redis for multi-instance prod.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig,
): { success: true } | { success: false; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true };
  }

  if (existing.count >= config.maxRequests) {
    return { success: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { success: true };
}
