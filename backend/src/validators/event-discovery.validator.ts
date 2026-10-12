
import { z } from "zod";

const positiveIntegerQuery = z
  .string()
  .regex(/^\d+$/, "Must be a whole number")
  .transform(Number)
  .pipe(z.number().int().min(1));

export const eventDiscoveryQuerySchema = z.object({
  all: z.enum(["true", "false"]).optional(),
  search: z.string().trim().max(100).optional(),
  paymentType: z.enum(["FREE", "PAID"]).optional(),
  page: positiveIntegerQuery.optional(),
  limit: positiveIntegerQuery.pipe(z.number().max(50)).optional(),
});
