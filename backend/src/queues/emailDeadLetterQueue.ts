import { Queue } from "bullmq";
import { connection } from "./emailQueue";

export const emailDeadLetterQueue = new Queue(
    "emailDeadLetterQueue",
    {
        connection
    }
);