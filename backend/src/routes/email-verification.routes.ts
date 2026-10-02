import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  verifyEmailAddress,
  resendVerificationEmailAddress
} from "../controllers/email-verification.controller";
import { validate } from "../middleware/validate";
import { verifyEmailSchema } from "../validators/email-verification.validator";

const router = Router();

router.post(
  "/verify",
  authenticate,
  validate(verifyEmailSchema),
  verifyEmailAddress
);

router.post(
  "/resend",
  authenticate,
  resendVerificationEmailAddress
);

export default router;