import { z } from "zod";

export const createCollegeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "College name must be at least 2 characters"),

  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "College domain is required")
});