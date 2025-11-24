"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const emailDeadLetterQueue_1 = require("../queues/emailDeadLetterQueue");
const emailService_1 = require("../services/emailService/emailService");
const emailQueue_1 = require("../queues/emailQueue");
const emailWorker = new bullmq_1.Worker("email-queue", async (job) => {
    console.log(`Email Worker processing: `, job.name, job.data);
    const result = await emailService_1.EmailService.sendEmail({ to: job.data.to, subject: job.data.subject, body: job.data.body });
    console.log(`Email sent to ${job.data.to}`);
    return { status: "sent", result };
}, {
    connection: emailQueue_1.connection,
    concurrency: 3,
    limiter: {
        max: 10,
        duration: 60000
    },
});
emailWorker.on("completed", job => {
    console.log(`Email Job ${job.id} completed`);
});
emailWorker.on("failed", async (job, err) => {
    console.log(`Email Job ${job.id} failed on attempt ${job.attemptsMade}`, err);
    if (job.attemptsMade === job.opts.attempts) {
        console.log(`Job ${job.id} has failed all attempts. Moving to DLQ.`);
        await emailDeadLetterQueue_1.emailDeadLetterQueue.add("failed-emails", {
            jobId: job.id,
            name: job.name,
            data: job.data,
            error: err.message,
        });
    }
});
