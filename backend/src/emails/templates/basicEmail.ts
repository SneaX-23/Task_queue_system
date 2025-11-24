export const basicEmailTemplate = (body: string) => 
                    `<div style="font-family: Arial, sans-serif; background: #f6f7f9; padding: 20px;">
                        <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">

                        <h2 style="color: #333; margin-top: 0;">Hello,</h2>

                        <p style="font-size: 16px; color: #555; line-height: 1.6;">
                            ${body}
                        </p>

                        <p style="margin-top: 30px; font-size: 14px; color: #888;">
                            This is an automated message — please don’t reply.
                        </p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

                        <p style="font-size: 13px; color: #aaa; text-align: center;">
                            © ${new Date().getFullYear()} sneax.quest • All rights reserved.
                        </p>

                        </div>
                    </div>`;