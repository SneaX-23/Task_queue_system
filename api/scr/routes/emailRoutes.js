import express from "express";
import { emailQueue } from "../queues/emailQueue.js";

const router = express.Router();

router.post("/send", async (req, res) => {
    try {
        const { to, subject, body } = req.body;

        if(!to || !subject || !body){
            return res.status(400).json({
                success: false,
                message: `Failed 'to', 'subject' and 'body' are required.`
            });
        }

        const job = await emailQueue.add(
            'sendEmail',
            { to, subject, body },
            {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: {
                    age: 3600,
                    count: 500,
                },
                removeOnFail: {
                    age: 86400,
                    count: 1000,
                }
            }
        );

        return res.json({
            success: true,
            jobId: job.id,
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
    

});

export default router;