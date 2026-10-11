
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { UserRole } from "../../generated/prisma/enums";

import {
  createVenueRequest,
  getCollegeVenuesRequest,
  updateVenueRequest
} from "../controllers/venue.controller";

import {
  createVenueSchema,
  updateVenueSchema
} from "../validators/venue.validator";


const router = Router();

// Create a venue
router.post(
  "/",
  authenticate,
  authorize(UserRole.COLLEGE_ADMIN),
  validate(createVenueSchema),
  createVenueRequest
);

// List venues
router.get(
  "/",
  authenticate,
  authorize(UserRole.COLLEGE_ADMIN),
  getCollegeVenuesRequest
);

// Update a venue
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.COLLEGE_ADMIN),
  validate(updateVenueSchema),
  updateVenueRequest
);

export default router;
