/**
 * Simple in-memory rate limiter for AI generation
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function checkRateLimit(
  userId: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= limit) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
}

export function getRateLimitInfo(userId: string): {
  remaining: number;
  resetTime: number;
} {
  const entry = rateLimitMap.get(userId);
  if (!entry || Date.now() > entry.resetTime) {
    return { remaining: 5, resetTime: Date.now() + 60 * 1000 };
  }

  return {
    remaining: Math.max(0, 5 - entry.count),
    resetTime: entry.resetTime,
  };
}
