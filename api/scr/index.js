import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import dotenv from "dotenv";

import jobRoutes from "./routes/jobRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; 

import { emailQueue } from "./queues/emailQueue.js";
import { reportQueue } from "./queues/reportQueue.js";
import { notificationQueue } from "./queues/notificationQueue.js";


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
  ],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.use("/jobs", jobRoutes);
app.use("/email", emailRoutes);
app.use("/report", reportRoutes);
app.use("/notification", notificationRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});