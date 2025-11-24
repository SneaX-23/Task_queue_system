import {z} from "zod"

export const CreateEmailSchema = z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string()
});

export type CreateEmailPayload = z.infer<typeof CreateEmailSchema>;