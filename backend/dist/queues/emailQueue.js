"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const connection = new ioredis_1.Redis({
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null
});
exports.connection = connection;
exports.emailQueue = new bullmq_1.Queue("email-queue", {
    connection,
});
