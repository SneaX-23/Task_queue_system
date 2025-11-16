import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: 'localhost',
    port: 6379
});

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const notificationWorker = new Worker("notificationQueue",
    async job => {
        console.log("Notification processing: ", job.name, job.data);
        await wait(150);
        console.log(`Push sent to device ${job.data.deviceToken}`);
        return {status: "push_sent"};
    },
    {
        connection,
        concurrency: 10,
        limiter: {
            max: 50,
            duration: 1000
        },
    }
);

notificationWorker.on("completed", job => console.log(`Notification job: ${job.id} completed.`));

notificationWorker.on("failed", (job, err) => console.log(`Notification job: ${job.id} failed`, err));