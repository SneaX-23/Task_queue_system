import { Queue } from "bullmq";
import { connection } from "../queue.js";

export const emailQueue = new Queue("emailQueue", {
    connection,
});