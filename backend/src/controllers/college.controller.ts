import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";
import {
  createCollege,
  approveCollege,
  rejectCollege
} from "../services/college.service";

export const createCollegeRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const college = await createCollege({
      name: req.body.name,
      domain: req.body.domain
    });

    res.status(201).json({
      success: true,
      message: "College onboarding request submitted successfully",
      data: college
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
      return;
    }

    if (
      error.message ===
      "College with this domain already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("College creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit college onboarding request"
    });
  }
};

export const approveCollegeRequest = async (
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

    const collegeId = req.params.id;

    if (!collegeId || Array.isArray(collegeId)) {
      res.status(400).json({
        success: false,
        message: "Invalid college ID"
      });
      return;
    }

    const college = await approveCollege(
      collegeId,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "College approved successfully",
      data: college
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
      return;
    }

    if (error.message === "College not found") {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (
      error.message ===
      "College is not pending verification"
    ) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("College approval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve college"
    });
  }
};

export const rejectCollegeRequest = async (
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

    const collegeId = req.params.id;

    if (!collegeId || Array.isArray(collegeId)) {
      res.status(400).json({
        success: false,
        message: "Invalid college ID"
      });
      return;
    }

    const college = await rejectCollege(
      collegeId,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "College rejected successfully",
      data: college
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
      return;
    }

    if (error.message === "College not found") {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (
      error.message ===
      "College is not pending verification"
    ) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("College rejection error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject college"
    });
  }
};