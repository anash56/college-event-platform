import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createCollegeApplication,
  getPendingCollegeApplications,
  approveCollegeApplication,
  rejectCollegeApplication,
} from "../services/collegeApplication.service";
import {
  verifyCollegeApplicationEmail,
  resendCollegeApplicationVerificationEmail,
} from "../services/email-verification.service";

export const createCollegeApplicationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const application = await createCollegeApplication(req.body);

    return res.status(201).json({
      success: true,
      message: "College application submitted successfully",
      application,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      if (error.message === "Government institution not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message === "This college is already registered" ||
        error.message ===
          "An active application already exists for this college"
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Failed to create college application:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit college application",
    });
  }
};

export const verifyCollegeApplicationEmailController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const applicationId = req.params.id;

    if (typeof applicationId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid college application ID",
      });
      return;
    }

    await verifyCollegeApplicationEmail(applicationId, req.body.otp);

    res.status(200).json({
      success: true,
      message:
        "Email verified successfully. Your application is awaiting admin review.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const statusCodes: Record<string, number> = {
      "College application not found": 404,
      "Verification request not found": 400,
      "OTP has expired": 400,
      "Too many invalid attempts": 429,
      "Invalid OTP": 400,
      "Application is not awaiting email verification": 409,
    };

    if (statusCodes[message]) {
      res.status(statusCodes[message]).json({
        success: false,
        message,
      });
      return;
    }

    console.error("College application email verification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify college application email",
    });
  }
};

export const resendCollegeApplicationEmailController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const applicationId = req.params.id;

    if (typeof applicationId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid college application ID",
      });
      return;
    }

    await resendCollegeApplicationVerificationEmail(applicationId);

    res.status(200).json({
      success: true,
      message: "Verification OTP sent successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const statusCodes: Record<string, number> = {
      "College application not found": 404,
      "Application is not awaiting email verification": 409,
    };

    if (statusCodes[message]) {
      res.status(statusCodes[message]).json({
        success: false,
        message,
      });
      return;
    }

    console.error("College application OTP resend error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
    });
  }
};

export const getPendingCollegeApplicationsController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const applications = await getPendingCollegeApplications();

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Failed to fetch pending college applications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch pending college applications",
    });
  }
};


export const approveCollegeApplicationController = async (
  req: Request,
  res: Response
) => {
  try {
    const applicationId = req.params.id;

    if (typeof applicationId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const reviewerId = (req as Request & { user: { userId: string } }).user
  .userId;

    const result = await approveCollegeApplication(
      applicationId,
      reviewerId
    );

    return res.status(200).json({
      success: true,
      message: "College application approved successfully",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "College application not found") {
      return res.status(404).json({ success: false, message });
    }

    if (
      message === "Application is not awaiting admin review" ||
      message === "This college is already registered"
    ) {
      return res.status(409).json({ success: false, message });
    }

    console.error("Approve college application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve college application",
    });
  }
};


export const rejectCollegeApplicationController = async (
  req: Request,
  res: Response
) => {
  try {
    const applicationId = req.params.id;

    if (typeof applicationId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const reviewerId = (req as Request & { user: { userId: string } }).user
      .userId;

    const { rejectionReason } = req.body;

    const application = await rejectCollegeApplication(
      applicationId,
      reviewerId,
      rejectionReason
    );

    return res.status(200).json({
      success: true,
      message: "College application rejected successfully",
      data: application,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "College application not found") {
      return res.status(404).json({ success: false, message });
    }

    if (
      message === "Application is not awaiting admin review" ||
      message === "Rejection reason is required"
    ) {
      return res.status(409).json({ success: false, message });
    }

    console.error("Reject college application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject college application",
    });
  }
};


