const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
import { Worker } from "bullmq";
import IORedis from "ioredis";

console.log("Worker started and listening for jobs...");

const connection = new IORedis({
    host: 'localhost',
    port: 6379
});

const worker = new Worker("jobs",
     async(job) => {
        console.log("Processing Job:", job.id, job.data);
        await wait(3000);
        return {status: "done"};
     },
        {
            connection,
            concurrency: 5,
            limiter: {
                max: 10,
                duration: 60000
            },
        }
    );

    worker.on("completed", (job) => {
        console.log(`Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.log(`>>> FAILED ATTEMPT for Job ${job.id}, attempt ${job.attemptsMade}`);
        console.log(err);
    });