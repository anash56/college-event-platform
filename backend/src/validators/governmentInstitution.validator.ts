import { z } from "zod";

export const searchInstitutionsSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Search query must be at least 2 characters"),
});