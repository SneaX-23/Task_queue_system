import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";


export const validate = 
    (schema: ZodSchema<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req.body);
            req.body = parsed;
            next();
        } catch (err: any) {
            return res.status(400).json({
                success: false,
                error: err.errors ?? err.message
            });
        }
    };