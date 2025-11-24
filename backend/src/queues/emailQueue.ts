import { Queue } from "bullmq";
import {Redis} from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null
});

export const emailQueue = new Queue("email-queue", {
  connection,
});

export {connection};