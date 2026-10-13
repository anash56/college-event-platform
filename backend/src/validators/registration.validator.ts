import { z } from "zod";

export const registerForEventSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
}).strict();

export const registrationIdSchema = z.object({
  id: z.string().uuid("Invalid registration ID"),
}).strict();