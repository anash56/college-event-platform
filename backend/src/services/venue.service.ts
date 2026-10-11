
import { prisma } from "../lib/prisma";

interface CreateVenueInput {
  adminUserId: string;
  name: string;
  capacity: number;
}

interface UpdateVenueInput {
  adminUserId: string;
  venueId: string;
  name?: string;
  capacity?: number;
}

const getCollegeAdmin = async (adminUserId: string) => {
  const admin = await prisma.user.findUnique({
    where: {
      id: adminUserId
    },
    select: {
      id: true,
      role: true,
      collegeId: true
    }
  });

  if (!admin || admin.role !== "COLLEGE_ADMIN") {
    throw new Error("College Admin not found");
  }

  if (!admin.collegeId) {
    throw new Error("College Admin is not associated with a college");
  }

  return admin;
};

export const createVenue = async (input: CreateVenueInput) => {
  const admin = await getCollegeAdmin(input.adminUserId);

  const college = await prisma.college.findUnique({
    where: {
      id: admin.collegeId!
    },
    select: {
      verificationStatus: true
    }
  });

  if (!college || college.verificationStatus !== "VERIFIED") {
    throw new Error("College is not verified");
  }

  const name = input.name.trim();

  const existingVenue = await prisma.venue.findUnique({
    where: {
      collegeId_name: {
        collegeId: admin.collegeId!,
        name
      }
    }
  });

  if (existingVenue) {
    throw new Error("Venue with this name already exists in this college");
  }

  return prisma.venue.create({
    data: {
      collegeId: admin.collegeId!,
      name,
      capacity: input.capacity
    }
  });
};

export const getCollegeVenues = async (adminUserId: string) => {
  const admin = await getCollegeAdmin(adminUserId);

  return prisma.venue.findMany({
    where: {
      collegeId: admin.collegeId!
    },
    orderBy: {
      name: "asc"
    }
  });
};

export const updateVenue = async (input: UpdateVenueInput) => {
  const admin = await getCollegeAdmin(input.adminUserId);
  const name = input.name?.trim();

  const venue = await prisma.venue.findFirst({
    where: {
      id: input.venueId,
      collegeId: admin.collegeId!
    }
  });

  if (!venue) {
    throw new Error("Venue not found in your college");
  }

  if (name !== undefined && name !== venue.name) {
    const duplicate = await prisma.venue.findUnique({
      where: {
        collegeId_name: {
          collegeId: admin.collegeId!,
          name
        }
      }
    });

    if (duplicate) {
      throw new Error("Venue with this name already exists in this college");
    }
  }

  return prisma.venue.update({
    where: {
      id: venue.id
    },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(input.capacity !== undefined
        ? { capacity: input.capacity }
        : {})
    }
  });
};
