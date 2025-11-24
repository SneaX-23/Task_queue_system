import { Request, Response } from "express";
import { emailQueue } from "../queues/emailQueue";

export class EmailController{
    static async send(req: Request, res: Response){
        const {to, subject, body} = req.body;
        try {
            const job = await emailQueue.add(
                "sendEmail", 
                    {to, subject, body},
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
                jobID: job.id,
            })
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: error.message
            })
        }
    }
}