import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import dotenv from "dotenv";
import client from "prom-client";
import jobRoutes from "./routes/jobRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; 

import { emailQueue } from "./queues/emailQueue.js";
import { reportQueue } from "./queues/reportQueue.js";
import { notificationQueue } from "./queues/notificationQueue.js";
import { emailDeadLetterQueue } from "./queues/emailDeadLetterQueue.js";

const app = express();
dotenv.config();

app.use(express.json());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(reportQueue),
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(emailDeadLetterQueue),
  ],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());
const register = new client.Registry();
client.collectDefaultMetrics({ register });

function setupQueueMetrics(queue, register) {
    const waiting = new client.Gauge({
        name: `${queue.name}_waiting_jobs`,
        help: `Number of waiting jobs in ${queue.name}`,
        registers: [register],
    });

    const active = new client.Gauge({
        name: `${queue.name}_active_jobs`,
        help: `Number of active jobs in ${queue.name}`,
        registers: [register],
    });

    const completed = new client.Gauge({
        name: `${queue.name}_completed_jobs`,
        help: `Total completed jobs in ${queue.name}`,
        registers: [register],
    });

    const failed = new client.Gauge({
        name: `${queue.name}_failed_jobs`,
        help: `Total failed jobs in ${queue.name}`,
        registers: [register],
    });

    const delayed = new client.Gauge({
        name: `${queue.name}_delayed_jobs`,
        help: `Jobs in delayed state in ${queue.name}`,
        registers: [register],
    });

    setInterval(async () => {
        const counts = await queue.getJobCounts();
        waiting.set(counts.waiting || 0);
        active.set(counts.active || 0);
        completed.set(counts.completed || 0);
        failed.set(counts.failed || 0);
        delayed.set(counts.delayed || 0);
    }, 5000);
}

setupQueueMetrics(emailQueue, register);
setupQueueMetrics(reportQueue, register);
setupQueueMetrics(notificationQueue, register);
setupQueueMetrics(emailDeadLetterQueue, register);

app.get("/metrics", async (req, res) => {
    try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.use("/jobs", jobRoutes);
app.use("/email", emailRoutes);
app.use("/report", reportRoutes);
app.use("/notification", notificationRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});