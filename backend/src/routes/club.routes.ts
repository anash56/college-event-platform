import { Router } from "express";
import { validate } from "../middleware/validate";
import { createClubRequest } from "../controllers/club.controller";
import { createClubSchema } from "../validators/club.validator";

const router = Router();

router.post(
  "/",
  validate(createClubSchema),
  createClubRequest
);

export default router;