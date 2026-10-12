
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";
import {
  createEvent,
  getMyEvents,
  updateEvent,
  publishEvent,
  cancelEvent,
} from "../services/event.service";

export const createEventRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const event = await createEvent({
      userId: req.user!.userId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event
    });
  } catch (error) {
    const statusByMessage: Record<string, number> = {
      "User not found": 404,
      "College Admin can only create college events": 403,
      "College Admin is not associated with a college": 403,
      "College is not verified": 409,
      "Club owner can only create club events": 403,
      "Club not found for this user": 404,
      "Club must be approved to create events": 409,
      "You are not allowed to create events": 403,
      "End time must be after start time": 400,
      "Choose a registered venue or an external venue": 400,
      "Venue not found in your college": 400,
      "Event capacity exceeds venue capacity": 400,
      "External venue name and address are both required": 400,
      "Paid events require a positive price": 400,
      "Free events cannot have a price": 400
    };

    const message =
      error instanceof Error ? error.message : "Event creation failed";

    const status = statusByMessage[message];

    if (status) {
      res.status(status).json({ success: false, message });
      return;
    }

    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      message: "Event creation failed"
    });
  }
};


export const getMyEventsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const events = await getMyEvents(req.user!.userId);

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events";

    if (message === "User not found") {
      res.status(404).json({ success: false, message });
      return;
    }

    if (
      message === "You are not allowed to view organizer events" ||
      message === "College Admin is not associated with a college" ||
      message === "Club not found for this user"
    ) {
      res.status(403).json({ success: false, message });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};


export const updateEventController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const event = await updateEvent({
      userId: req.user!.userId,
      eventId: req.params.id as string,
      ...req.body,
    });

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update event";

    if (message === "Event not found" || message === "User not found") {
      res.status(404).json({ success: false, message });
      return;
    }

    if (
      message === "You cannot update this event" ||
      message === "You are not allowed to update events"
    ) {
      res.status(403).json({ success: false, message });
      return;
    }

    if (message === "Only draft events can be updated") {
      res.status(400).json({ success: false, message });
      return;
    }

    res.status(400).json({ success: false, message });
  }
};


export const publishEventController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const event = await publishEvent(
      req.user!.userId,
      req.params.id as string
    );

    res.status(200).json({
      success: true,
      message: "Event published successfully",
      event,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to publish event";

    if (message === "User not found" || message === "Event not found") {
      res.status(404).json({ success: false, message });
      return;
    }

    if (
      message === "You cannot publish this event" ||
      message === "You are not allowed to publish events"
    ) {
      res.status(403).json({ success: false, message });
      return;
    }

    res.status(400).json({ success: false, message });
  }
};


export const cancelEventController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const event = await cancelEvent(
      req.user!.userId,
      req.params.id as string
    );

    res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      event,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel event";

    if (message === "User not found" || message === "Event not found") {
      res.status(404).json({ success: false, message });
      return;
    }

    if (
      message === "You cannot cancel this event" ||
      message === "You are not allowed to cancel events"
    ) {
      res.status(403).json({ success: false, message });
      return;
    }

    res.status(400).json({ success: false, message });
  }
};
