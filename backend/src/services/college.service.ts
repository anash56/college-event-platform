import { prisma } from "../lib/prisma";

interface CreateCollegeInput {
  name: string;
  domain: string;
}

export const createCollege = async (
  input: CreateCollegeInput
) => {
  const existingCollege = await prisma.college.findUnique({
    where: {
      domain: input.domain
    }
  });

  if (existingCollege) {
    throw new Error("College with this domain already exists");
  }

  const college = await prisma.college.create({
    data: {
      name: input.name,
      domain: input.domain,
      verificationStatus: "PENDING"
    }
  });

  return college;
};

export const approveCollege = async (
  collegeId: string,
  actorUserId: string
) => {
  const college = await prisma.college.findUnique({
    where: {
      id: collegeId
    }
  });

  if (!college) {
    throw new Error("College not found");
  }

  if (college.verificationStatus !== "PENDING") {
    throw new Error("College is not pending verification");
  }

  const updatedCollege = await prisma.$transaction(async (tx) => {
    const updatedCollege = await tx.college.update({
      where: {
        id: collegeId
      },
      data: {
        verificationStatus: "VERIFIED"
      }
    });

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "COLLEGE_APPROVED",
        entityType: "COLLEGE",
        entityId: collegeId
      }
    });

    return updatedCollege;
  });

  return updatedCollege;
};

export const rejectCollege = async (
  collegeId: string,
  actorUserId: string
) => {
  const college = await prisma.college.findUnique({
    where: {
      id: collegeId
    }
  });

  if (!college) {
    throw new Error("College not found");
  }

  if (college.verificationStatus !== "PENDING") {
    throw new Error("College is not pending verification");
  }

  const updatedCollege = await prisma.$transaction(async (tx) => {
    const updatedCollege = await tx.college.update({
      where: {
        id: collegeId
      },
      data: {
        verificationStatus: "REJECTED"
      }
    });

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "COLLEGE_REJECTED",
        entityType: "COLLEGE",
        entityId: collegeId
      }
    });

    return updatedCollege;
  });

  return updatedCollege;
};