import { Worker } from "bullmq";
import { emailDeadLetterQueue } from "../queues/emailDeadLetterQueue";
import { EmailService } from "../services/emailService/emailService";
import { connection } from "../queues/emailQueue";

const emailWorker = new Worker(
    "email-queue",
    async job => {
        console.log(`Email Worker processing: `, job.name, job.data);

        const result = await EmailService.sendEmail({to: job.data.to, subject: job.data.subject, body: job.data.body});

        console.log(`Email sent to ${job.data.to}`);
        return {status: "sent", result};
    },
    {
        connection,
        concurrency: 3,
        limiter: {
            max: 10,
            duration: 60000
        },
    }
);

emailWorker.on("completed", job => {
    console.log(`Email Job ${job.id} completed`)
});

emailWorker.on("failed", async(job: any, err: any) => {
    console.log(`Email Job ${job.id} failed on attempt ${job.attemptsMade}`, err);
    if (job.attemptsMade === job.opts.attempts) {
                console.log(`Job ${job.id} has failed all attempts. Moving to DLQ.`);
                await emailDeadLetterQueue.add("failed-emails",
                    {
                        jobId: job.id,
                        name: job.name,
                        data: job.data,
                        error: err.message,
                    }
                );
            }
        }
);