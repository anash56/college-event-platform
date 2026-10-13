import { Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { AuthenticatedRequest } from "../middleware/authenticate";
import {
  registerForEvent,
  getMyRegistrations,
  cancelMyRegistration,
} from "../services/registration.service";

export const registerForEventController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { eventId } = req.body;

    const registration = await registerForEvent(req.user!.userId, eventId);

    res.status(201).json({
      success: true,
      message: "Successfully registered for event",
      registration,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message: "You are already registered for this event",
      });
      return;
    }

    const statusCodes: Record<string, number> = {
      "Event not found": 404,
      "User not found": 404,
      "Only students can register for events": 403,
      "Student is not associated with a college": 403,
      "Please verify your email before registering": 403,
      "Event is not available for registration": 409,
      "Registration is closed because the event has started": 409,
      "Event's club is not approved": 409,
      "You cannot register for this college-only event": 403,
      "You are already registered for this event": 409,
      "Event is full": 409,
    };

    if (!statusCodes[message]) {
      console.error("Registration error:", error);
    }

    res.status(statusCodes[message] ?? 500).json({
      success: false,
      message: statusCodes[message] ? message : "Registration failed",
    });
  }
};

export const getMyRegistrationsController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const registrations = await getMyRegistrations(req.user!.userId);

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch registrations";

    if (message === "User not found") {
      res.status(404).json({ success: false, message });
      return;
    }

    if (message === "Only students can view their registrations") {
      res.status(403).json({ success: false, message });
      return;
    }

    console.error("Fetch registrations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
};

export const cancelMyRegistrationController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const registrationId = req.params.id;

    if (typeof registrationId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid registration ID",
      });
      return;
    }

    const registration = await cancelMyRegistration(
      req.user!.userId,
      registrationId,
    );

    res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
      registration,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cancellation failed";

    const statusCodes: Record<string, number> = {
      "User not found": 404,
      "Registration not found": 404,
      "Only students can cancel registrations": 403,
      "You cannot cancel another student's registration": 403,
      "Only free registrations can be cancelled": 403,
      "Registration is already cancelled": 409,
      "The event has been cancelled by its organizer": 409,
      "Registration cannot be cancelled after the event starts": 409,
    };

    if (!statusCodes[message]) {
      console.error("Cancellation error:", error);
    }

    res.status(statusCodes[message] ?? 500).json({
      success: false,
      message: statusCodes[message] ? message : "Cancellation failed",
    });
  }
};
