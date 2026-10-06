import { Request, Response } from "express";
import { createClub } from "../services/club.service";

export const createClubRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const club = await createClub({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      collegeId: req.body.collegeId
    });

    res.status(201).json({
      success: true,
      message: "Club registration submitted successfully",
      data: club
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

    if (error.message === "College is not verified") {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error.message === "Email is already registered") {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (
      error.message ===
      "Club with this name already exists in this college"
    ) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Club creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to register club"
    });
  }
};