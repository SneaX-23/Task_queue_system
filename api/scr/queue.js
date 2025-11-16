import {Queue} from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: 'localhost',
    port: 6379
});

export const jobQueue = new Queue("jobs", {
    connection
});

export {connection};