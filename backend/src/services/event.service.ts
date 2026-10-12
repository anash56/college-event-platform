import { prisma } from "../lib/prisma";

interface CreateEventInput {
  userId: string;
  creatorType: "COLLEGE" | "CLUB";
  venueId?: string | null;
  externalVenue?: string | null;
  venueAddress?: string | null;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  capacity?: number | null;
  visibility?: "COLLEGE_ONLY" | "OPEN";
  isPaid: boolean;
  price?: number | null;
}

export const createEvent = async (input: CreateEventInput) => {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      role: true,
      collegeId: true,
      ownedClub: {
        select: {
          id: true,
          collegeId: true,
          status: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  let creatorId: string;
  let collegeId: string;

  if (user.role === "COLLEGE_ADMIN") {
    if (input.creatorType !== "COLLEGE") {
      throw new Error("College Admin can only create college events");
    }

    if (!user.collegeId) {
      throw new Error("College Admin is not associated with a college");
    }

    const college = await prisma.college.findUnique({
      where: { id: user.collegeId },
      select: { verificationStatus: true },
    });

    if (!college || college.verificationStatus !== "VERIFIED") {
      throw new Error("College is not verified");
    }

    creatorId = user.collegeId;
    collegeId = user.collegeId;
  } else if (user.role === "CLUB") {
    if (input.creatorType !== "CLUB") {
      throw new Error("Club owner can only create club events");
    }

    const club = user.ownedClub;

    if (!club) throw new Error("Club not found for this user");
    if (club.status !== "APPROVED") {
      throw new Error("Club must be approved to create events");
    }

    creatorId = club.id;
    collegeId = club.collegeId;
  } else {
    throw new Error("You are not allowed to create events");
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime()) ||
    endTime <= startTime
  ) {
    throw new Error("End time must be after start time");
  }

  if (input.venueId && (input.externalVenue || input.venueAddress)) {
    throw new Error("Choose a registered venue or an external venue");
  }

  if (input.venueId) {
    const venue = await prisma.venue.findFirst({
      where: { id: input.venueId, collegeId },
      select: { id: true, capacity: true },
    });

    if (!venue) throw new Error("Venue not found in your college");

    if (input.capacity != null && input.capacity > venue.capacity) {
      throw new Error("Event capacity exceeds venue capacity");
    }
  } else if (input.externalVenue || input.venueAddress) {
    if (!input.externalVenue?.trim() || !input.venueAddress?.trim()) {
      throw new Error("External venue name and address are both required");
    }
  }

  if (input.isPaid) {
    if (input.price == null || input.price <= 0) {
      throw new Error("Paid events require a positive price");
    }
  } else if (input.price != null) {
    throw new Error("Free events cannot have a price");
  }

  return prisma.event.create({
    data: {
      creatorType: input.creatorType,
      creatorId,
      venueId: input.venueId ?? null,
      externalVenue: input.externalVenue?.trim() || null,
      venueAddress: input.venueAddress?.trim() || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startTime,
      endTime,
      capacity: input.capacity ?? null,
      visibility: input.visibility ?? "COLLEGE_ONLY",
      isPaid: input.isPaid,
      price: input.isPaid ? input.price! : null,
      status: "DRAFT",
    },
  });
};

export const getMyEvents = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      collegeId: true,
      ownedClub: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "COLLEGE_ADMIN") {
    if (!user.collegeId) {
      throw new Error("College Admin is not associated with a college");
    }

    return prisma.event.findMany({
      where: {
        creatorType: "COLLEGE",
        creatorId: user.collegeId,
      },
      include: {
        venue: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  if (user.role === "CLUB") {
    if (!user.ownedClub) {
      throw new Error("Club not found for this user");
    }

    return prisma.event.findMany({
      where: {
        creatorType: "CLUB",
        creatorId: user.ownedClub.id,
      },
      include: {
        venue: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  throw new Error("You are not allowed to view organizer events");
};

interface UpdateEventInput {
  userId: string;
  eventId: string;
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string;
  capacity?: number | null;
  visibility?: "COLLEGE_ONLY" | "OPEN";
  venueId?: string | null;
  externalVenue?: string | null;
  venueAddress?: string | null;
}

export const updateEvent = async (input: UpdateEventInput) => {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      role: true,
      collegeId: true,
      ownedClub: {
        select: { id: true },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
  });

  if (!event) throw new Error("Event not found");

  if (
    user.role === "COLLEGE_ADMIN" &&
    (event.creatorType !== "COLLEGE" || event.creatorId !== user.collegeId)
  ) {
    throw new Error("You cannot update this event");
  }

  if (
    user.role === "CLUB" &&
    (event.creatorType !== "CLUB" || event.creatorId !== user.ownedClub?.id)
  ) {
    throw new Error("You cannot update this event");
  }

  if (user.role !== "COLLEGE_ADMIN" && user.role !== "CLUB") {
    throw new Error("You are not allowed to update events");
  }

  if (event.status !== "DRAFT") {
    throw new Error("Only draft events can be updated");
  }

  const startTime = input.startTime
    ? new Date(input.startTime)
    : event.startTime;

  const endTime = input.endTime ? new Date(input.endTime) : event.endTime;

  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  const venueId = input.venueId !== undefined ? input.venueId : event.venueId;

  const externalVenue =
    input.externalVenue !== undefined
      ? input.externalVenue
      : event.externalVenue;

  const venueAddress =
    input.venueAddress !== undefined ? input.venueAddress : event.venueAddress;

  if (venueId && (externalVenue || venueAddress)) {
    throw new Error("Choose a registered venue or an external venue");
  }

  if (!venueId && Boolean(externalVenue) !== Boolean(venueAddress)) {
    throw new Error("External venue name and address are both required");
  }

  if (venueId) {
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        collegeId:
          user.role === "COLLEGE_ADMIN"
            ? user.collegeId!
            : (await prisma.club.findUnique({
                where: { id: user.ownedClub!.id },
                select: { collegeId: true },
              }))!.collegeId,
      },
      select: { id: true, capacity: true },
    });

    if (!venue) throw new Error("Venue not found in your college");

    const capacity =
      input.capacity !== undefined ? input.capacity : event.capacity;
    if (capacity != null && capacity > venue.capacity) {
      throw new Error("Event capacity exceeds venue capacity");
    }
  }

  return prisma.event.update({
    where: { id: input.eventId },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && {
        description: input.description?.trim() || null,
      }),
      ...(input.startTime !== undefined && { startTime }),
      ...(input.endTime !== undefined && { endTime }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      venueId,
      externalVenue: externalVenue?.trim() || null,
      venueAddress: venueAddress?.trim() || null,
    },
  });
};

export const publishEvent = async (userId: string, eventId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      collegeId: true,
      ownedClub: {
        select: { id: true, status: true },
      },
    },
  });

  if (!user) throw new Error("User not found");

  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { payoutAccount: true },
    });

    if (!event) throw new Error("Event not found");

    if (
      user.role === "COLLEGE_ADMIN" &&
      (event.creatorType !== "COLLEGE" || event.creatorId !== user.collegeId)
    ) {
      throw new Error("You cannot publish this event");
    }

    if (
      user.role === "CLUB" &&
      (event.creatorType !== "CLUB" || event.creatorId !== user.ownedClub?.id)
    ) {
      throw new Error("You cannot publish this event");
    }

    if (user.role !== "COLLEGE_ADMIN" && user.role !== "CLUB") {
      throw new Error("You are not allowed to publish events");
    }

    if (event.status !== "DRAFT") {
      throw new Error("Only draft events can be published");
    }

    if (user.role === "CLUB" && user.ownedClub?.status !== "APPROVED") {
      throw new Error("Club must be approved to publish events");
    }

    if (event.endTime <= new Date()) {
      throw new Error("Event end time must be in the future");
    }

    if (event.venueId) {
      const venue = await tx.venue.findUnique({
        where: { id: event.venueId },
        select: { capacity: true },
      });

      if (!venue) throw new Error("Venue not found");

      if (event.capacity != null && event.capacity > venue.capacity) {
        throw new Error("Event capacity exceeds venue capacity");
      }

      // Serialize publishes for the same venue so the availability check and
      // status update cannot be interleaved by another publish transaction.
      await tx.$queryRaw`SELECT id FROM "Venue" WHERE id = ${event.venueId} FOR UPDATE`;
    }

    await checkVenueAvailability(
      tx,
      event.venueId,
      event.startTime,
      event.endTime,
      event.id,
    );

    if (event.isPaid) {
      if (
        !event.payoutAccountId ||
        !event.payoutAccount ||
        event.payoutAccount.status !== "ACTIVE"
      ) {
        throw new Error("An active payout account is required");
      }
    }

    return tx.event.update({
      where: { id: eventId },
      data: { status: "PUBLISHED" },
    });
  });
};

const checkVenueAvailability = async (
  client: Pick<typeof prisma, "event">,
  venueId: string | null,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string,
) => {
  if (!venueId) return;

  const overlappingEvent = await client.event.findFirst({
    where: {
      venueId,
      status: "PUBLISHED",
      ...(excludeEventId && {
        id: { not: excludeEventId },
      }),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (overlappingEvent) {
    throw new Error("Venue is already booked for this time");
  }
};

export const cancelEvent = async (userId: string, eventId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      collegeId: true,
      ownedClub: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Event not found");

  if (
    user.role === "COLLEGE_ADMIN" &&
    (event.creatorType !== "COLLEGE" || event.creatorId !== user.collegeId)
  ) {
    throw new Error("You cannot cancel this event");
  }

  if (
    user.role === "CLUB" &&
    (event.creatorType !== "CLUB" || event.creatorId !== user.ownedClub?.id)
  ) {
    throw new Error("You cannot cancel this event");
  }

  if (user.role !== "COLLEGE_ADMIN" && user.role !== "CLUB") {
    throw new Error("You are not allowed to cancel events");
  }

  if (event.status !== "PUBLISHED") {
    throw new Error("Only published events can be cancelled");
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { status: "CANCELLED" },
  });
};

export const getPublishedEvents = async (
  userId: string,
  showAllColleges: boolean = false,
  search?: string,
  paymentType?: "FREE" | "PAID",
  page: number = 1,
  limit: number = 10,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      collegeId: true,
    },
  });

  if (!user) throw new Error("User not found");

  if (user.role !== "STUDENT") {
    throw new Error("Only students can browse events");
  }

  if (!user.collegeId) {
    throw new Error("Student is not associated with a college");
  }

  const clubs = await prisma.club.findMany({
    where: {
      collegeId: user.collegeId,
      status: "APPROVED",
    },
    select: {
      id: true,
    },
  });

  const clubIds = clubs.map((club) => club.id);

  const where = {
    status: "PUBLISHED" as const,
    startTime: {
      gte: new Date(),
    },
    ...(search && {
  AND: [
    {
      OR: [
        {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    },
  ],
}),
    ...(paymentType === "FREE" && { isPaid: false }),
    ...(paymentType === "PAID" && { isPaid: true }),
    OR: showAllColleges
      ? [
          { visibility: "OPEN" as const },
          {
            creatorType: "COLLEGE" as const,
            creatorId: user.collegeId,
          },
          {
            creatorType: "CLUB" as const,
            creatorId: { in: clubIds },
          },
        ]
      : [
          {
            creatorType: "COLLEGE" as const,
            creatorId: user.collegeId,
          },
          {
            creatorType: "CLUB" as const,
            creatorId: { in: clubIds },
          },
        ],
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        venue: true,
      },
      orderBy: {
        startTime: "asc",
      },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
