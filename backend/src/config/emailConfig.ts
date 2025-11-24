import dotenv from "dotenv";
import { Resend } from "resend";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const resend = new Resend(process.env.RESEND_API_KEY);
