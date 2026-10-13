import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  registerForEventController,
  getMyRegistrationsController,
  cancelMyRegistrationController,
} from "../controllers/registration.controller";
import {
  registerForEventSchema,
  registrationIdSchema,
} from "../validators/registration.validator";

const router = Router();

router.get(
  "/mine",
  authenticate,
  getMyRegistrationsController,
);

router.post(
  "/",
  authenticate,
  validate(registerForEventSchema),
  registerForEventController,
);

router.patch(
  "/:id/cancel",
  authenticate,
  validate(registrationIdSchema, "params"),
  cancelMyRegistrationController,
);

export default router;