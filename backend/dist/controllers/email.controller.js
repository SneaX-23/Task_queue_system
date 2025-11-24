"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const emailQueue_1 = require("../queues/emailQueue");
class EmailController {
    static async send(req, res) {
        const { to, subject, body } = req.body;
        try {
            const job = await emailQueue_1.emailQueue.add("sendEmail", { to, subject, body }, {
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
            });
            return res.json({
                success: true,
                jobID: job.id,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.EmailController = EmailController;
