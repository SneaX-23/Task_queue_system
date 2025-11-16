import { Queue } from "bullmq";
import { connection } from "../queue.js";

export const reportQueue = new Queue("reportQueue", {
    connection,
});