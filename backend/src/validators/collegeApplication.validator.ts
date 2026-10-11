import { z } from "zod";

export const createCollegeApplicationSchema = z.object({
  governmentInstitutionId: z
    .string()
    .uuid("Invalid government institution ID"),

  representativeName: z
    .string()
    .trim()
    .min(2, "Representative name must be at least 2 characters"),

  position: z
    .string()
    .trim()
    .min(2, "Position is required"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 characters")
    .max(15, "Phone number must be at most 15 characters"),
});

export const verifyCollegeApplicationEmailSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});



export const rejectCollegeApplicationSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, "Rejection reason is required")
    .max(500, "Rejection reason cannot exceed 500 characters"),
});


export const acceptCollegeAdminInvitationSchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required"),
  name: z.string().trim().min(1, "Name is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
