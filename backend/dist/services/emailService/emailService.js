"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const emailConfig_1 = require("../../config/emailConfig");
const basicEmail_1 = require("../../emails/templates/basicEmail");
class EmailService {
    static async sendEmail({ to, subject, body }) {
        const msg = {
            from: "No Reply <no-reply@sneax.quest>",
            to,
            subject,
            html: (0, basicEmail_1.basicEmailTemplate)(body)
        };
        try {
            const result = await emailConfig_1.resend.emails.send(msg);
            return result;
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
}
exports.EmailService = EmailService;
