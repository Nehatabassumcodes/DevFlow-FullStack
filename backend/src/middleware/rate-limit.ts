import type { Request, RequestHandler } from 'express';
import { AppError } from '../utils/app-error';
import { getRequestUserId } from './auth';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

// Small in-memory fixed-window limiter, keyed by the signed-in user (falls back to the IP).
// It protects a paid upstream API from runaway clients. State is per process, so with several
// server instances the effective limit is per instance.
export function rateLimitPerUser({ windowMs, max, message }: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res, next) => {
    const now = Date.now();
    if (buckets.size > 1000) {
      for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
    }

    const key = getRequestUserId(req) ?? req.ip ?? 'anonymous';
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      next(new AppError(429, message ?? 'Too many requests. Please wait a moment and try again.', 'RATE_LIMITED'));
      return;
    }
    next();
  };
}
