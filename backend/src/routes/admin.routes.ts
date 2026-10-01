import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { UserRole } from "../../generated/prisma/enums";
import { testCollegeAdminAccess } from "../controllers/admin.controller";

const router = Router();

router.get(
  "/test",
  authenticate,
  authorize(UserRole.COLLEGE_ADMIN),
  testCollegeAdminAccess
);

export default router;