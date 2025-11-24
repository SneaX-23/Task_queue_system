"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridRateLimit = hybridRateLimit;
const emailQueue_js_1 = require("../queues/emailQueue.js");
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
function hybridRateLimit(options) {
    return async (req, res, next) => {
        try {
            const { capacity, refillRatePerSec, windowSizeSec, maxRequestsInWindow, } = options;
            const ip = req.ip || req.connection?.remoteAddress || "unknown";
            const bucketTokens = `tb:${ip}:tokens`;
            const bucketRefill = `tb:${ip}:refill`;
            const windowKey = `sw:${ip}:timestamps`;
            const now = Date.now();
            const refillPerMs = refillRatePerSec / 1000;
            /* ------------------------- TOKEN BUCKET CHECK ------------------------- */
            const bucketResult = await emailQueue_js_1.connection.eval(luaTokenBucket, 2, bucketTokens, bucketRefill, capacity.toString(), refillPerMs.toString(), now.toString());
            if (!Array.isArray(bucketResult)) {
                return next();
            }
            const bucketStatus = Number(bucketResult[0]); // 1 or -1
            const retryMs = Number(bucketResult[1]); // wait time
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
            await emailQueue_js_1.connection.zremrangebyscore(windowKey, 0, cutoff);
            // Count requests in the window
            const currentCount = await emailQueue_js_1.connection.zcount(windowKey, cutoff, now);
            if (currentCount >= maxRequestsInWindow) {
                const ttl = await emailQueue_js_1.connection.pttl(windowKey);
                const retryAfterSec = Math.ceil(ttl / 1000);
                res.setHeader("X-RateLimit-Remaining", 0);
                res.setHeader("Retry-After", retryAfterSec);
                return res.status(429).json({
                    success: false,
                    message: "Too many requests (rate limit exceeded).",
                    retryAfterSeconds: retryAfterSec,
                });
            }
            await emailQueue_js_1.connection.zadd(windowKey, now, now.toString());
            await emailQueue_js_1.connection.pexpire(windowKey, windowSizeMs);
            /* ------------------------- All checks passed ------------------------- */
            res.setHeader("X-RateLimit-Remaining", Math.floor(tokensRemaining));
            return next();
        }
        catch (err) {
            console.error("Hybrid Rate Limit Error:", err);
            return next();
        }
    };
}
