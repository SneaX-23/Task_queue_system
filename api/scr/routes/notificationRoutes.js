import express from "express";
import { notificationQueue } from "../queues/notificationQueue.js";

const router = express.Router();

router.post("/push", 
    async (req, res) => {
        try {
            const {deviceToken, title, body} = req.body;
            
            if(!deviceToken || !title || !body){
                return res.status(400).json({
                    success: false,
                    message: "Fields 'deviceToken', 'title' and 'body' are required."
                });
            }
            const job = await notificationQueue.add(
                "sendPush",
                {deviceToken, title, body},
                {
                    attempts: 5,
                    backoff: {
                        type: "exponential",
                        delay: 2000,
                    },
                    removeOnComplete: {
                        age: 1800,
                        count: 500,
                    },
                    removeOnFail: {
                        age: 86400,
                        count: 1000,
                    },
                }
            );

            return res.json({
                success: true,
                jobIdd: job.id,
            });


        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message,
            })
        }
    }
);

export default router;