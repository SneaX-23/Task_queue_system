import { QueueScheduler } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: "localhost",
    port: 6379
});

new QueueScheduler("notificationQueue", { connection });

console.log("Notification Queue Scheduler running...");
