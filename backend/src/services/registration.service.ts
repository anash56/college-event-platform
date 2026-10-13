import { prisma } from "../lib/prisma";

export const registerForEvent = async (
  userId: string,
  eventId: string,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Lock the event to prevent concurrent registrations from
      // exceeding the event capacity.
      const lockedEvents = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "Event"
        WHERE "id" = ${eventId}
        FOR UPDATE
      `;

      if (lockedEvents.length === 0) {
        throw new Error("Event not found");
      }

      // Validate the student.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          collegeId: true,
          emailVerified: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.role !== "STUDENT") {
        throw new Error("Only students can register for events");
      }

      if (!user.collegeId) {
        throw new Error("Student is not associated with a college");
      }

      if (!user.emailVerified) {
        throw new Error("Please verify your email before registering");
      }

      // Validate the event.
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      if (event.status !== "PUBLISHED") {
        throw new Error("Event is not available for registration");
      }

      if (event.startTime <= new Date()) {
        throw new Error(
          "Registration is closed because the event has started",
        );
      }

      // Determine which college owns the event.
      let eventCollegeId: string;

      if (event.creatorType === "COLLEGE") {
        eventCollegeId = event.creatorId;
      } else {
        const club = await tx.club.findUnique({
          where: { id: event.creatorId },
          select: {
            collegeId: true,
            status: true,
          },
        });

        if (!club || club.status !== "APPROVED") {
          throw new Error("Event's club is not approved");
        }

        eventCollegeId = club.collegeId;
      }

      // Enforce event visibility.
      if (
        event.visibility === "COLLEGE_ONLY" &&
        eventCollegeId !== user.collegeId
      ) {
        throw new Error(
          "You cannot register for this college-only event",
        );
      }

      // Find any previous registration for this student and event.
      const existingRegistration = await tx.registration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      // An active registration cannot be duplicated.
      if (existingRegistration?.status === "ACTIVE") {
        throw new Error("You are already registered for this event");
      }

      // Count only active registrations.
      // Pending paid registrations also reserve seats.
      const registrationCount = await tx.registration.count({
        where: {
          eventId,
          status: "ACTIVE",
        },
      });

      if (
        event.capacity !== null &&
        registrationCount >= event.capacity
      ) {
        throw new Error("Event is full");
      }

      // Reactivate a previously cancelled free registration.
      // Do not automatically reuse a cancelled paid registration.
      if (existingRegistration) {
        if (event.isPaid) {
          throw new Error(
            "Cancelled paid registrations cannot be reactivated automatically",
          );
        }

        return tx.registration.update({
          where: {
            id: existingRegistration.id,
          },
          data: {
            status: "ACTIVE",
            paymentStatus: "FREE",
          },
        });
      }

      // Create a new registration.
      return tx.registration.create({
        data: {
          eventId,
          userId,
          status: "ACTIVE",
          paymentStatus: event.isPaid ? "PENDING" : "FREE",
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error("You are already registered for this event");
    }

    throw error;
  }
};

export const getMyRegistrations = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "STUDENT") {
    throw new Error("Only students can view their registrations");
  }

  return prisma.registration.findMany({
    where: {
      userId,
    },
    include: {
      event: {
        include: {
          venue: true,
        },
      },
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const cancelMyRegistration = async (
  userId: string,
  registrationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const registrationReference = await tx.registration.findUnique({
      where: {
        id: registrationId,
      },
      select: {
        eventId: true,
      },
    });

    if (!registrationReference) {
      throw new Error("Registration not found");
    }

    // Use the same event lock as registration so cancellation and seat
    // accounting are serialized for an event.
    const lockedEvents = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "Event"
      WHERE "id" = ${registrationReference.eventId}
      FOR UPDATE
    `;

    if (lockedEvents.length === 0) {
      throw new Error("Registration not found");
    }

    const registration = await tx.registration.findUnique({
      where: {
        id: registrationId,
      },
      include: {
        event: true,
      },
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "STUDENT") {
      throw new Error("Only students can cancel registrations");
    }

    // Students can cancel only their own registrations.
    if (registration.userId !== userId) {
      throw new Error(
        "You cannot cancel another student's registration",
      );
    }

    if (registration.status === "CANCELLED") {
      throw new Error("Registration is already cancelled");
    }

    // Students cannot cancel paid registrations.
    if (registration.paymentStatus !== "FREE") {
      throw new Error("Only free registrations can be cancelled");
    }

    if (registration.event.status === "CANCELLED") {
      throw new Error(
        "The event has been cancelled by its organizer",
      );
    }

    if (registration.event.startTime <= new Date()) {
      throw new Error(
        "Registration cannot be cancelled after the event starts",
      );
    }

    // Preserve the record and payment status.
    // Cancelled registrations no longer occupy a seat.
    return tx.registration.update({
      where: {
        id: registrationId,
      },
      data: {
        status: "CANCELLED",
      },
    });
  });
};