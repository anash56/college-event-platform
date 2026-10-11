
import { z } from "zod";

export const createVenueSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Venue name must be at least 2 characters")
    .max(100, "Venue name must be at most 100 characters"),

  capacity: z
    .number()
    .int("Capacity must be an integer")
    .positive("Capacity must be greater than zero")
});

export const updateVenueSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Venue name must be at least 2 characters")
    .max(100, "Venue name must be at most 100 characters")
    .optional(),

  capacity: z
    .number()
    .int("Capacity must be an integer")
    .positive("Capacity must be greater than zero")
    .optional()
}).refine(
  (data) => data.name !== undefined || data.capacity !== undefined,
  {
    message: "At least one field (name or capacity) must be provided"
  }
);
