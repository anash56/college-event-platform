import { prisma } from "../lib/prisma";
import { createOrRefreshEmailVerification } from "./email-verification.service";
import { hashPassword } from "../utils/password";

interface CreateClubInput {
  name: string;
  email: string;
  password: string;
  collegeId: string;
}

export const createClub = async (input: CreateClubInput) => {
  // 1. Check college
  const college = await prisma.college.findUnique({
    where: {
      id: input.collegeId
    }
  });

  if (!college) {
    throw new Error("College not found");
  }

  // 2. Club can only register under a verified college
  if (college.verificationStatus !== "VERIFIED") {
    throw new Error("College is not verified");
  }

  // 3. Check whether email is already used
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  // 4. Check duplicate club name within the college
  const existingClub = await prisma.club.findUnique({
    where: {
      collegeId_name: {
        collegeId: input.collegeId,
        name: input.name
      }
    }
  });

  if (existingClub) {
    throw new Error("Club with this name already exists in this college");
  }

  // 5. Hash password
  const passwordHash = await hashPassword(input.password);

  // 6. Create user + club together
  const club = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "CLUB",
        collegeId: input.collegeId,
        emailVerified: false
      }
    });

    const newClub = await tx.club.create({
      data: {
        collegeId: input.collegeId,
        ownerUserId: user.id,
        name: input.name,
        status: "PENDING"
      }
    });

    return newClub;
  });

  // 7. Send email verification OTP
  await createOrRefreshEmailVerification(
    club.ownerUserId,
    input.email
  );

  return club;
};