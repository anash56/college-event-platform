import { Request, Response } from "express";
import {
  createClub,
  getPendingClubs,
  reviewClub,
} from "../services/club.service";
import { AuthenticatedRequest } from "../middleware/authenticate";

export const createClubRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const club = await createClub({
      ownerName: req.body.ownerName,
      clubName: req.body.clubName,
      email: req.body.email,
      password: req.body.password,
      collegeId: req.body.collegeId,
    });

    res.status(201).json({
      success: true,
      message: "Club registration submitted successfully",
      data: club,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
      return;
    }

    if (error.message === "College not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error.message === "College is not verified" ||
      error.message === "Email is already registered" ||
      error.message === "Club with this name already exists in this college"
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Club creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to register club",
    });
  }
};

export const getPendingClubsRequest = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const clubs = await getPendingClubs({
      adminUserId: req.user!.userId,
    });

    res.status(200).json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "College Admin not found" ||
        error.message === "College Admin is not associated with a college"
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    console.error("Fetch pending clubs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending clubs",
    });
  }
};


export const approveClubRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const clubId = req.params.id;

    if (typeof clubId !== "string" || !clubId.trim()) {
      res.status(400).json({
        success: false,
        message: "Invalid club ID"
      });
      return;
    }

    const club = await reviewClub({
      adminUserId: req.user!.userId,
      clubId,
      decision: "APPROVED"
    });

    res.status(200).json({
      success: true,
      message: "Club approved successfully",
      data: club
    });
  } catch (error) {
    handleClubReviewError(error, res);
  }
};

export const rejectClubRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const clubId = req.params.id;

    if (typeof clubId !== "string" || !clubId.trim()) {
      res.status(400).json({
        success: false,
        message: "Invalid club ID"
      });
      return;
    }

    const club = await reviewClub({
      adminUserId: req.user!.userId,
      clubId,
      decision: "REJECTED"
    });

    res.status(200).json({
      success: true,
      message: "Club rejected successfully",
      data: club
    });
  } catch (error) {
    handleClubReviewError(error, res);
  }
};

const handleClubReviewError = (
  error: unknown,
  res: Response
): void => {
  if (error instanceof Error) {
    const statusByMessage: Record<string, number> = {
      "College Admin not found": 403,
      "College Admin is not associated with a college": 403,
      "Club not found in your college": 404,
      "Only pending clubs can be reviewed": 409,
      "Club has already been reviewed": 409
    };

    const status = statusByMessage[error.message];

    if (status) {
      res.status(status).json({
        success: false,
        message: error.message
      });
      return;
    }
  }

  console.error("Club review error:", error);

  res.status(500).json({
    success: false,
    message: "Failed to review club"
  });
};
