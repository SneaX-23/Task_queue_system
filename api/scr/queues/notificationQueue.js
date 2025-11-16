import { Queue } from "bullmq";
import { connection } from "../queue.js";

export const notificationQueue = new Queue("notificationQueue", {
    connection,
});