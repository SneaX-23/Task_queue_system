import { connection as redis } from "../queue.js";

export const rataLimiter = async (req, res, next) => {
    const ip = req.ip;
    const key = `rate_limit:${ip}`;

    const count = await redis.incr(key);

    if(count === 1){
        await redis.expire(key, 10);
    }
    
    if(count > 5){
        return res.status(429).json({
            succes: false,
            message: "Too many requests. Please wait>"
        })
    }

    next();
};