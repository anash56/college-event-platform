import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { UserRole } from "../../generated/prisma/enums";

import {
  createCollegeRequest,
  approveCollegeRequest,
  rejectCollegeRequest
} from "../controllers/college.controller";

import { createCollegeSchema } from "../validators/college.validator";

const router = Router();

// Public college onboarding request
router.post(
  "/",
  validate(createCollegeSchema),
  createCollegeRequest
);

// Platform Admin approves college
router.patch(
  "/:id/approve",
  authenticate,
  authorize(UserRole.PLATFORM_ADMIN),
  approveCollegeRequest
);

router.patch(
  "/:id/reject",
  authenticate,
  authorize(UserRole.PLATFORM_ADMIN),
  rejectCollegeRequest
);
export default router;