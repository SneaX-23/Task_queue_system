import { connection as redis } from "../queues/emailQueue.js";
import { Request, Response, NextFunction } from "express";

/* ---------------- Token Bucket Script ---------------- */

const luaTokenBucket = `
local keyTokens = KEYS[1]
local keyRefill = KEYS[2]

local capacity = tonumber(ARGV[1])
local refill_per_ms = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local tokens = tonumber(redis.call("GET", keyTokens) or capacity)
local lastRefill = tonumber(redis.call("GET", keyRefill) or now)

local elapsed = now - lastRefill
local refillAmount = elapsed * refill_per_ms
tokens = math.min(capacity, tokens + refillAmount)

if tokens < 1 then
  local needed = 1 - tokens
  local wait_ms = math.ceil(needed / refill_per_ms)
  return { -1, wait_ms, tokens }
else
  tokens = tokens - 1
  redis.call("SET", keyTokens, tokens)
  redis.call("SET", keyRefill, now)
  return { 1, tokens }
end
`;

interface HybridRateLimitOptions {
  capacity: number;             // Token bucket capacity
  refillRatePerSec: number;     // How many tokens per second
  windowSizeSec: number;        // Sliding window period (seconds)
  maxRequestsInWindow: number;  // Max requests allowed inside window
}

export function hybridRateLimit(options: HybridRateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        capacity,
        refillRatePerSec,
        windowSizeSec,
        maxRequestsInWindow,
      } = options;

      const ip =
        req.ip || req.connection?.remoteAddress || "unknown";

      const bucketTokens = `tb:${ip}:tokens`;
      const bucketRefill = `tb:${ip}:refill`;
      const windowKey = `sw:${ip}:timestamps`;

      const now = Date.now();
      const refillPerMs = refillRatePerSec / 1000;

      /* ------------------------- TOKEN BUCKET CHECK ------------------------- */

      const bucketResult = await redis.eval(
        luaTokenBucket,
        2,
        bucketTokens,
        bucketRefill,
        capacity.toString(),
        refillPerMs.toString(),
        now.toString()
      );

      if (!Array.isArray(bucketResult)) {
        return next();
      }

      const bucketStatus = Number(bucketResult[0]); // 1 or -1
      const retryMs = Number(bucketResult[1]);      // wait time
      const tokensRemaining = Number(bucketResult[2]);

      if (bucketStatus === -1) {
        // too fast (burst limit)
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("Retry-After", Math.ceil(retryMs / 1000));
        return res.status(429).json({
          success: false,
          message: "Too many requests (burst limit). Slow down.",
          retryAfterSeconds: Math.ceil(retryMs / 1000),
        });
      }

      /* --------------------- SLIDING WINDOW CHECK --------------------- */

      const windowSizeMs = windowSizeSec * 1000;
      const cutoff = now - windowSizeMs;

      // Remove old timestamps
      await redis.zremrangebyscore(windowKey, 0, cutoff);

      // Count requests in the window
      const currentCount = await redis.zcount(windowKey, cutoff, now);

      if (currentCount >= maxRequestsInWindow) {
        const ttl = await redis.pttl(windowKey);
        const retryAfterSec = Math.ceil(ttl / 1000);

        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("Retry-After", retryAfterSec);

        return res.status(429).json({
          success: false,
          message: "Too many requests (rate limit exceeded).",
          retryAfterSeconds: retryAfterSec,
        });
      }

      
      await redis.zadd(windowKey, now, now.toString());

      
      await redis.pexpire(windowKey, windowSizeMs);

      /* ------------------------- All checks passed ------------------------- */
      res.setHeader("X-RateLimit-Remaining", Math.floor(tokensRemaining));
      return next();
    } catch (err) {
      console.error("Hybrid Rate Limit Error:", err);
      return next();
    }
  };
}
