import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../config/env";

const brevo = new BrevoClient({
  apiKey: env.BREVO_API_KEY
});

export const sendVerificationEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Verify your email",
    htmlContent: `
      <h2>College Event Platform</h2>

      <p>Your email verification OTP is:</p>

      <h1>${otp}</h1>

      <p>This OTP will expire in 10 minutes.</p>

      <p>If you did not request this, you can ignore this email.</p>
    `,
    sender: {
      name: env.BREVO_SENDER_NAME,
      email: env.BREVO_SENDER_EMAIL
    },
    to: [
      {
        email
      }
    ]
  });
};