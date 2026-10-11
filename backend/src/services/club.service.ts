import { prisma } from "../lib/prisma";
import { createOrRefreshEmailVerification } from "./email-verification.service";
import { hashPassword } from "../utils/password";

interface CreateClubInput {
  ownerName: string;
  clubName: string;
  email: string;
  password: string;
  collegeId: string;
}

export const createClub = async (input: CreateClubInput) => {
  const ownerName = input.ownerName.trim();
  const clubName = input.clubName.trim();
  const email = input.email.trim().toLowerCase();

  // 1. Check whether the college exists.
  const college = await prisma.college.findUnique({
    where: {
      id: input.collegeId,
    },
  });

  if (!college) {
    throw new Error("College not found");
  }

  // 2. Only verified colleges can register clubs.
  if (college.verificationStatus !== "VERIFIED") {
    throw new Error("College is not verified");
  }

  // 3. Check whether the email is already registered.
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  // 4. Check for a duplicate club name within the college.
  const existingClub = await prisma.club.findUnique({
    where: {
      collegeId_name: {
        collegeId: input.collegeId,
        name: clubName,
      },
    },
  });

  if (existingClub) {
    throw new Error("Club with this name already exists in this college");
  }

  // 5. Hash the owner's password.
  const passwordHash = await hashPassword(input.password);

  // 6. Create the owner and club atomically.
  const club = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: ownerName,
        email,
        passwordHash,
        role: "CLUB",
        collegeId: input.collegeId,
        emailVerified: false,
      },
    });

    const newClub = await tx.club.create({
      data: {
        collegeId: input.collegeId,
        ownerUserId: user.id,
        name: clubName,
        status: "PENDING",
      },
    });

    return newClub;
  });

  // 7. Send email verification OTP.
  await createOrRefreshEmailVerification(email);

  return club;
};

interface CollegeAdminInput {
  adminUserId: string;
}

export const getPendingClubs = async (input: CollegeAdminInput) => {
  // Find the College Admin and their college.
  const admin = await prisma.user.findUnique({
    where: {
      id: input.adminUserId,
    },
    select: {
      id: true,
      role: true,
      collegeId: true,
    },
  });

  if (!admin || admin.role !== "COLLEGE_ADMIN") {
    throw new Error("College Admin not found");
  }

  if (!admin.collegeId) {
    throw new Error("College Admin is not associated with a college");
  }

  return prisma.club.findMany({
    where: {
      collegeId: admin.collegeId,
      status: "PENDING",
    },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const reviewClub = async (input: {
  adminUserId: string;
  clubId: string;
  decision: "APPROVED" | "REJECTED";
}) => {
  return prisma.$transaction(async (tx) => {
    // 1. Find the College Admin and their college.
    const admin = await tx.user.findUnique({
      where: {
        id: input.adminUserId,
      },
      select: {
        id: true,
        role: true,
        collegeId: true,
      },
    });

    if (!admin || admin.role !== "COLLEGE_ADMIN") {
      throw new Error("College Admin not found");
    }

    if (!admin.collegeId) {
      throw new Error("College Admin is not associated with a college");
    }

    // 2. Ensure the club belongs to this administrator's college.

    const club = await tx.club.findFirst({
      where: {
        id: input.clubId,
        collegeId: admin.collegeId,
      },
      select: {
        id: true,
        status: true,
        owner: {
          select: {
            emailVerified: true,
          },
        },
      },
    });

    if (!club) {
      throw new Error("Club not found in your college");
    }

    if (club.status !== "PENDING") {
      throw new Error("Only pending clubs can be reviewed");
    }

    if (input.decision === "APPROVED" && !club.owner.emailVerified) {
      throw new Error("Club owner's email is not verified");
    }

    // 3. Update only if the club is still pending.
    const result = await tx.club.updateMany({
      where: {
        id: club.id,
        collegeId: admin.collegeId,
        status: "PENDING",
      },
      data: {
        status: input.decision,
        approvedBy: input.decision === "APPROVED" ? admin.id : null,
        approvedAt: input.decision === "APPROVED" ? new Date() : null,
      },
    });

    if (result.count !== 1) {
      throw new Error("Club has already been reviewed");
    }

    return tx.club.findUniqueOrThrow({
      where: {
        id: club.id,
      },
      select: {
        id: true,
        name: true,
        collegeId: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        updatedAt: true,
      },
    });
  });
};
