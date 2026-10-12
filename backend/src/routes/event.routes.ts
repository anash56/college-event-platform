
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  createEventController,
  getMyEventsController,
  updateEventController,
  publishEventController,
  cancelEventController,
  getPublishedEventsController,
} from "../controllers/event.controller";
import { createEventSchema,updateEventSchema } from "../validators/event.validator";
import { eventDiscoveryQuerySchema } from "../validators/event-discovery.validator";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createEventSchema),
  createEventController
);


router.get(
  "/mine",
  authenticate,
  getMyEventsController
);

router.patch(
  "/:id",
  authenticate,
  validate(updateEventSchema),
  updateEventController
);

router.patch(
  "/:id/publish",
  authenticate,
  publishEventController
);

router.patch(
  "/:id/cancel",
  authenticate,
  cancelEventController
);

router.get(
  "/",
  authenticate,
  validate(eventDiscoveryQuerySchema, "query"),
  getPublishedEventsController
);

export default router;
