
import { prisma } from "../lib/prisma";
import { hashPassword } from "../utils/password";
import { hashInvitationToken } from "../utils/invitation-token";
import { UserRole } from "../../generated/prisma/enums";

interface AcceptCollegeAdminInvitationInput {
  token: string;
  name: string;
  password: string;
}

export const acceptCollegeAdminInvitation = async (
  input: AcceptCollegeAdminInvitationInput
) => {
  const token = input.token.trim();
  const name = input.name.trim();

  if (!token) {
    throw new Error("Invitation token is required");
  }

  if (!name) {
    throw new Error("Name is required");
  }

  if (!input.password) {
    throw new Error("Password is required");
  }

  const tokenHash = hashInvitationToken(token);

  // Find the invitation before doing expensive password hashing.
  const invitation = await prisma.collegeAdminInvitation.findUnique({
    where: { tokenHash },
    include: { college: true },
  });

  if (!invitation) {
    throw new Error("Invalid invitation");
  }

  if (invitation.acceptedAt) {
    throw new Error("Invitation has already been used");
  }

  if (invitation.expiresAt <= new Date()) {
    throw new Error("Invitation has expired");
  }

  if (invitation.college.verificationStatus !== "VERIFIED") {
    throw new Error("This college is not approved");
  }

  const passwordHash = await hashPassword(input.password);

  // Create the user and consume the invitation atomically.
  return prisma.$transaction(async (tx) => {
    const currentInvitation =
      await tx.collegeAdminInvitation.findUnique({
        where: { id: invitation.id },
        include: { college: true },
      });

    if (!currentInvitation) {
      throw new Error("Invalid invitation");
    }

    if (currentInvitation.acceptedAt) {
      throw new Error("Invitation has already been used");
    }

    if (currentInvitation.expiresAt <= new Date()) {
      throw new Error("Invitation has expired");
    }

    if (
      currentInvitation.college.verificationStatus !== "VERIFIED"
    ) {
      throw new Error("This college is not approved");
    }

    const existingUser = await tx.user.findUnique({
      where: { email: currentInvitation.email },
    });

    if (existingUser) {
      throw new Error(
        "An account already exists with this email. Please contact the platform team."
      );
    }

    const existingAdmin = await tx.user.findFirst({
      where: {
        collegeId: currentInvitation.collegeId,
        role: UserRole.COLLEGE_ADMIN,
      },
    });

    if (existingAdmin) {
      throw new Error("This college already has a College Admin");
    }

    // Claim the invitation only if it is still unused and unexpired.
    const claimed = await tx.collegeAdminInvitation.updateMany({
      where: {
        id: currentInvitation.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        acceptedAt: new Date(),
      },
    });

    if (claimed.count !== 1) {
      throw new Error(
        "Invitation is invalid, expired, or already used"
      );
    }

    const user = await tx.user.create({
      data: {
        name,
        email: currentInvitation.email,
        passwordHash,
        role: UserRole.COLLEGE_ADMIN,
        collegeId: currentInvitation.collegeId,
        emailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        collegeId: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "COLLEGE_ADMIN_INVITATION_ACCEPTED",
        entityType: "CollegeAdminInvitation",
        entityId: currentInvitation.id,
      },
    });

    return user;
  });
};
