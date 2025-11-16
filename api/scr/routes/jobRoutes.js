import express from "express";
import { jobQueue } from "../queue.js";
import { rataLimiter } from "../middleware/rateLimiter.js";
import { tokenBucket } from "../middleware/tokenBucket.js";

const router = express.Router();

router.post("/", tokenBucket, async(req,res) => {
    try {
        const {message} = req.body;

        const job = await jobQueue.add("simple-job",
            {message}, 
            {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: {
                    age: 10,
                    count: 500,
                },
                removeOnFail: {
                    age: 86400,
                    count: 1000
                }
            }
        );

        return res.json({
            success: true,
            jobId: job.id
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
})

router.get("/:id", async(req, res) => {
    const {id} = req.params;

    try {

        const job = await jobQueue.getJob(id);
        if(!job){
            return res.status(404).json({
                success: false,
                message: "Job not found."
            });
        }

        const state = await job.getState();
        const result = await job.returnvalue;
        const failedReason = job.failedReason;
        const totalAttempts = job.opts.attempts;
        const attemptsMade = job.attemptsMade;

        const backoff = job.opts.backoff;

        let nextRetry = null;

        if(state === "failed" && attemptsMade < totalAttempts){
            if(backoff?.type === "exponential"){
                const baseDelay = backoff.delay;
                const retryDelay = baseDelay * Math.pow(2, attemptsMade - 1);

                nextRetry = job.finishedOn + retryDelay;
            }
        }

        return res.json({
            success: true,
            id: job.id,
            state,
            data: job.data,
            result,
            failedReason,
            timestamps: {
                created: job.timestamp,
                processed: job.processedOn,
                finished: job.finishedOn
            },
            retry: {
                attemptsMade,
                totalAttempts,
                backoff,
                nextRetry
            },
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        })
    }
})

export default router;