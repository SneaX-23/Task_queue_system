import express from "express";

import {reportQueue} from "../queues/reportQueue.js"

const router = express.Router();

router.post("/generate", async (req, res) => {
    try {
        const {userId, title, content} = req.body;

        if (!userId || !title || !content) {
            return res.status(400).json({
                success: false,
                message: "Fields 'userId', 'title', and 'content' are required."
            });
        }

        const job = await reportQueue.add(
            "generatePDF",
            { userId, title, content },
            {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 3000,
                },
                removeOnComplete: {
                    age: 3600,
                    count: 200
                },
                removeOnFail: {
                    age: 86400,
                    count: 500,
                }
            }
        );

        return res.json({
            success: true,
            jobId: job.id,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
})

export default router;