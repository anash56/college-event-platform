
import { z } from "zod";

export const createClubSchema = z.object({
  ownerName: z
    .string()
    .trim()
    .min(2, "Owner name must be at least 2 characters")
    .max(100, "Owner name must be at most 100 characters"),

  clubName: z
    .string()
    .trim()
    .min(2, "Club name must be at least 2 characters")
    .max(100, "Club name must be at most 100 characters"),

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
