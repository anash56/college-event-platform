import { z } from "zod";

export const createClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Club name must be at least 2 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  collegeId: z
    .string()
    .uuid("Invalid college ID")
});