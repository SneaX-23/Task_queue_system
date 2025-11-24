import { resend } from "../../config/emailConfig";
import { CreateEmailPayload } from "../../schemas/email.schema";
import { basicEmailTemplate } from "../../emails/templates/basicEmail";

export class EmailService{
    
    static async sendEmail({to, subject, body}: CreateEmailPayload): Promise<any>{
        
        const msg = {
            from: "No Reply <no-reply@sneax.quest>",
            to,
            subject,
            html: basicEmailTemplate(body)
        }

        try {
            const result = await resend.emails.send(msg);
            return result
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}