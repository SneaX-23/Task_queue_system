import { Router } from "express";
import { validate } from "../middleware/validate";
import { CreateEmailSchema } from "../schemas/email.schema";
import { EmailController } from "../controllers/email.controller";
import { tokenBucket } from "../middleware/tockenBucket";

const router = Router();

router.post("/send",tokenBucket({capacity: 10, refillRatePerSec: 0.5}),validate(CreateEmailSchema), EmailController.send);

export default router;