
import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { UserRole } from "../../generated/prisma/enums";

import {
  createClubRequest,
  getPendingClubsRequest,
  approveClubRequest,
  rejectClubRequest
} from "../controllers/club.controller";

import { createClubSchema } from "../validators/club.validator";

const router = Router();

// Public club registration
router.post(
  "/",
  validate(createClubSchema),
  createClubRequest
);

// College Admin: list pending clubs
router.get(
  "/pending",
  authenticate,
  authorize(UserRole.COLLEGE_ADMIN),
  getPendingClubsRequest
);

// College Admin: approve a club
router.patch(
  "/:id/approve",
  authenticate,
  authorize(UserRole.COLLEGE_ADMIN),
  approveClubRequest
);

// College Admin: reject a club
router.patch(
  "/:id/reject",
  authenticate,
  authorize(UserRole.COLLEGE_ADMIN),
  rejectClubRequest
);

export default router;
