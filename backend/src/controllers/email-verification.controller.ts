import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";
import {
  verifyEmail,
  resendVerificationEmail
} from "../services/email-verification.service";

export const verifyEmailAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
  res.status(401).json({
    success: false,
    message: "Authentication required"
  });
  return;
}

await verifyEmail(
  req.user.userId,
  req.body.otp
);
    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
      return;
    }

    const knownErrors = [
      "Verification request not found",
      "OTP has expired",
      "Too many invalid attempts",
      "Invalid OTP"
    ];

    if (knownErrors.includes(error.message)) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Email verification error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const resendVerificationEmailAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    await resendVerificationEmail(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Verification OTP sent successfully"
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
      return;
    }

    const knownErrors = [
      "User not found",
      "Email is already verified"
    ];

    if (knownErrors.includes(error.message)) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Resend verification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to resend verification email"
    });
  }
};