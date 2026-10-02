import { z } from "zod";

export const verifyEmailSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits")
});