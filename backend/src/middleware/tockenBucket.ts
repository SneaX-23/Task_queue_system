import { connection as redis } from "../queues/emailQueue";
import { Request, Response, NextFunction } from "express";

const lua = `
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

interface TokenBucketOptions {
  capacity: number;
  refillRatePerSec: number;
}

export function tokenBucket(options: TokenBucketOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { capacity, refillRatePerSec } = options;

      const ip =
        req.ip || req.connection?.remoteAddress || "unknown";

      const keyTokens = `tb:${ip}:tokens`;
      const keyRefill = `tb:${ip}:lastRefill`;

      const refillPerMs = refillRatePerSec / 1000;
      const now = Date.now();

      const result = await redis.eval(
        lua,
        2,
        keyTokens,
        keyRefill,
        capacity.toString(),
        refillPerMs.toString(),
        now.toString()
      );

      if (!result || !Array.isArray(result)) {
        return next();
      }

      const status = Number(result[0]);
      const value = Number(result[1]);
      const tokensRemaining = Number(result[2]);

      if (status === 1) {
        res.setHeader("X-RateLimit-Remaining", Math.floor(tokensRemaining));
        return next();
      } else {
        const waitMs = value;
        res.setHeader("Retry-After", Math.ceil(waitMs / 1000));
        return res.status(429).json({
          success: false,
          message: "Too many requests (token bucket). Try again later.",
          retryAfterSeconds: Math.ceil(waitMs / 1000),
        });
      }
    } catch (err) {
      console.error("TokenBucket middleware error:", err);
      return next();
    }
  };
}
