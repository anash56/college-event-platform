import { Router } from "express";
import {
  createCollegeApplicationController,
  verifyCollegeApplicationEmailController,
  resendCollegeApplicationEmailController,
  getPendingCollegeApplicationsController,
  approveCollegeApplicationController,
  rejectCollegeApplicationController,
} from "../controllers/collegeApplication.controller";

import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import {
  createCollegeApplicationSchema,
  verifyCollegeApplicationEmailSchema,
  rejectCollegeApplicationSchema,
} from "../validators/collegeApplication.validator";

import { validate } from "../middleware/validate";

const router = Router();

// Submit a college application
router.post(
  "/",
  validate(createCollegeApplicationSchema),
  createCollegeApplicationController
);

// Verify application email using OTP
router.post(
  "/:id/verify-email",
  validate(verifyCollegeApplicationEmailSchema),
  verifyCollegeApplicationEmailController
);

// Resend application verification OTP
router.post(
  "/:id/resend-email",
  resendCollegeApplicationEmailController
);

router.get(
  "/pending",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  getPendingCollegeApplicationsController
);

router.post(
  "/:id/approve",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  approveCollegeApplicationController
);

router.post(
  "/:id/reject",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  validate(rejectCollegeApplicationSchema),
  rejectCollegeApplicationController
);

export default router;