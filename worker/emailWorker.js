import { Worker } from "bullmq";
import IORedis from "ioredis";
import {Resend} from "resend";
import dotenv from "dotenv";
dotenv.config({ path: "../api/.env" });

const connection = new IORedis({
    host: "localhost",
    port: 6379
});
const resend = new Resend(process.env.RESEND_API_KEY);

const emailWorker = new Worker(
    "emailQueue", 
    async job => {
        console.log(`Email Worker processing: `, job.name, job.data);

        const result = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: job.data.to,
            subject: job.data.subject,
            html: `<p>${job.data.body}<p>`
        });

        console.log(`Email sent to ${job.data.to}`);
        return { status: "sent", result };
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

emailWorker.on("completed", job => console.log(`Email Job ${job.id} completed`));

emailWorker.on("failed", (job, err) => console.log(`Email Job ${job.id} failed`, err));