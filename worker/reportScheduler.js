import { QueueScheduler } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: "localhost",
    port: 6379
});

new QueueScheduler("reportQueue", { connection });

console.log("Report Queue Scheduler running...");
