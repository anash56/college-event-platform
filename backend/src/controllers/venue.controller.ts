
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";
import {
  createVenue,
  getCollegeVenues,
  updateVenue
} from "../services/venue.service";

const handleVenueError = (error: unknown, res: Response): void => {
  if (error instanceof Error) {
    const statusByMessage: Record<string, number> = {
      "College Admin not found": 403,
      "College Admin is not associated with a college": 403,
      "College is not verified": 409,
      "Venue with this name already exists in this college": 409,
      "Venue not found in your college": 404
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

  console.error("Venue operation error:", error);

  res.status(500).json({
    success: false,
    message: "Venue operation failed"
  });
};

export const createVenueRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const venue = await createVenue({
      adminUserId: req.user!.userId,
      name: req.body.name,
      capacity: req.body.capacity
    });

    res.status(201).json({
      success: true,
      message: "Venue created successfully",
      data: venue
    });
  } catch (error) {
    handleVenueError(error, res);
  }
};

export const getCollegeVenuesRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const venues = await getCollegeVenues(req.user!.userId);

    res.status(200).json({
      success: true,
      data: venues
    });
  } catch (error) {
    handleVenueError(error, res);
  }
};

export const updateVenueRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const venueId = req.params.id;

    if (typeof venueId !== "string" || !venueId.trim()) {
      res.status(400).json({
        success: false,
        message: "Invalid venue ID"
      });
      return;
    }

    const venue = await updateVenue({
      adminUserId: req.user!.userId,
      venueId,
      name: req.body.name,
      capacity: req.body.capacity
    });

    res.status(200).json({
      success: true,
      message: "Venue updated successfully",
      data: venue
    });
  } catch (error) {
    handleVenueError(error, res);
  }
};
