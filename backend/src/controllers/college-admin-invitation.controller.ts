
import { Request, Response } from "express";
import { ZodError } from "zod";
import { acceptCollegeAdminInvitation } from "../services/college-admin-invitation.service";

export const acceptCollegeAdminInvitationController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await acceptCollegeAdminInvitation({
      token: req.body.token,
      name: req.body.name,
      password: req.body.password,
    });

    res.status(201).json({
      success: true,
      message: "College Admin account created successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    const statusCodes: Record<string, number> = {
      "Invitation token is required": 400,
      "Name is required": 400,
      "Password is required": 400,
      "Invalid invitation": 400,
      "Invitation has expired": 410,
      "Invitation has already been used": 409,
      "This college is not approved": 409,
      "This college already has a College Admin": 409,
      "An account already exists with this email. Please contact the platform team.": 409,
    };

    const status = statusCodes[message];

    if (status) {
      res.status(status).json({
        success: false,
        message,
      });
      return;
    }

    console.error("College Admin invitation acceptance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to accept college admin invitation",
    });
  }
};
