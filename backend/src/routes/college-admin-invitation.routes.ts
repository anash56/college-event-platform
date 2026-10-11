
import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  acceptCollegeAdminInvitationController,
} from "../controllers/college-admin-invitation.controller";
import {
  acceptCollegeAdminInvitationSchema,
} from "../validators/collegeApplication.validator";

const router = Router();

router.post(
  "/accept",
  validate(acceptCollegeAdminInvitationSchema),
  acceptCollegeAdminInvitationController
);

export default router;
