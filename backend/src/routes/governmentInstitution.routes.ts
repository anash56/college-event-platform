import { Router } from "express";
import {
  searchInstitutionsController,
} from "../controllers/governmentInstitution.controller";
import {
  searchInstitutionsSchema,
} from "../validators/governmentInstitution.validator";
import { validate } from "../middleware/validate";

const router = Router();

router.get(
  "/search",
  validate(searchInstitutionsSchema, "query"),
  searchInstitutionsController
);

export default router;