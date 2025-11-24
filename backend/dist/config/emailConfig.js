"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resend = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const resend_1 = require("resend");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../../.env") });
exports.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
