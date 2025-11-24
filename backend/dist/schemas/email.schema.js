"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEmailSchema = void 0;
const zod_1 = require("zod");
exports.CreateEmailSchema = zod_1.z.object({
    to: zod_1.z.string().email(),
    subject: zod_1.z.string(),
    body: zod_1.z.string()
});
