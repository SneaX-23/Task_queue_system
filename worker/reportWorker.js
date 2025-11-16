import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: 'localhost',
    port: 6379
});
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const reportWorker = new Worker("reportQueue",
    async job => {
        console.log("Report generation processing: ", job.name, job.data);
        await wait(3500);
        console.log(`PDF generated for user ${job.data.userId}`);
        return { status: "pdf_generated" };
    },
    {
        connection,
        concurrency: 3,
        limiter: {
            max: 5,
            duration: 60000
        },
    }
);

reportWorker.on("completed", job => console.log(`Report job: ${job.id} completed.`));

reportWorker.on("failed", (job, err) => console.log(`Report job: ${job.id} failed`, err));