
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { createEventRequest,getMyEventsController,updateEventController,  publishEventController,
  cancelEventController
} from "../controllers/event.controller";
import { createEventSchema,updateEventSchema } from "../validators/event.validator";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createEventSchema),
  createEventRequest
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
export default router;
