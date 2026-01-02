import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message, keyGenerator, skip } = options;
  return (req: Request, res: Response, next: NextFunction) => {
    if (skip?.(req)) return next();

    const key =
      keyGenerator?.(req) ||
      `${req.ip || req.socket.remoteAddress || "unknown"}:${req.path}`;
    const now = Date.now();
    const existing = buckets.get(key);
    if (!existing || now >= existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfter = Math.max(0, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        success: false,
        ok: false,
        message: message || "Terlalu banyak percobaan. Coba lagi nanti.",
      });
    }

    return next();
  };
}
