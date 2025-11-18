import { Queue } from "bullmq";
import { connection } from "../queue.js";

export const emailDeadLetterQueue = new Queue(
    "emailDeadLetterQueue",
    {
        connection,
    }
);