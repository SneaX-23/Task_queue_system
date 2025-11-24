"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailDeadLetterQueue = void 0;
const bullmq_1 = require("bullmq");
const emailQueue_1 = require("./emailQueue");
exports.emailDeadLetterQueue = new bullmq_1.Queue("emailDeadLetterQueue", {
    connection: emailQueue_1.connection
});
