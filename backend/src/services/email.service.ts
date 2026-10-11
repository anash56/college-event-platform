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


export const sendCollegeAdminInvitationEmail = async (
  email: string,
  invitationUrl: string
): Promise<void> => {
  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Your college has been approved - Set up your admin account",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">
        <h2>College Event Platform</h2>

        <h3>Your college has been approved!</h3>

        <p>Hello,</p>

        <p>
          Your college registration request has been approved by our
          platform team. You are invited to set up your College Admin account.
        </p>

        <p>As a College Admin, you will be able to:</p>

        <ul>
          <li>Review and manage club applications</li>
          <li>Manage college-level events</li>
          <li>Manage your college's event activities</li>
        </ul>

        <p style="margin: 28px 0;">
          <a
            href="${invitationUrl}"
            style="background-color: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;"
          >
            Set Up Your Admin Account
          </a>
        </p>

        <p>
          This invitation expires in 24 hours and can only be used once.
          If it expires, contact the platform team for a new invitation.
        </p>

        <p>
          If you were not expecting this email, you can safely ignore it.
        </p>

        <p>Regards,<br />College Event Platform Team</p>
      </div>
    `,
    sender: {
      name: env.BREVO_SENDER_NAME,
      email: env.BREVO_SENDER_EMAIL,
    },
    to: [{ email }],
  });
};
