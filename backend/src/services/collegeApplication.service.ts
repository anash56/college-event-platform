import { prisma } from "../lib/prisma";
import { createOrRefreshEmailVerification } from "./email-verification.service";
import {
  generateInvitationToken,
  hashInvitationToken,
  getInvitationExpiry,
} from "../utils/invitation-token";

import { sendCollegeAdminInvitationEmail } from "./email.service";
import { env } from "../config/env";

interface CreateCollegeApplicationInput {
  governmentInstitutionId: string;
  representativeName: string;
  position: string;
  email: string;
  phone: string;
}

export const createCollegeApplication = async (
  data: CreateCollegeApplicationInput
) => {
  const institution = await prisma.governmentInstitution.findUnique({
    where: {
      id: data.governmentInstitutionId,
    },
  });

  if (!institution) {
    throw new Error("Government institution not found");
  }

  const existingCollege = await prisma.college.findUnique({
    where: {
      governmentInstitutionId: data.governmentInstitutionId,
    },
  });

  if (existingCollege) {
    throw new Error("This college is already registered");
  }

  const existingApplication =
    await prisma.collegeApplication.findFirst({
      where: {
        governmentInstitutionId: data.governmentInstitutionId,
        status: {
          in: [
            "PENDING_EMAIL_VERIFICATION",
            "PENDING_ADMIN_REVIEW",
          ],
        },
      },
    });

  if (existingApplication) {
    throw new Error(
      "An active application already exists for this college"
    );
  }

  const application = await prisma.collegeApplication.create({
    data: {
      governmentInstitutionId: data.governmentInstitutionId,
      representativeName: data.representativeName,
      position: data.position,
      email: data.email,
      phone: data.phone,
    },
  });
  await createOrRefreshEmailVerification(application.email);

  return application;
};

export const getPendingCollegeApplications = async () => {
  return prisma.collegeApplication.findMany({
    where: {
      status: "PENDING_ADMIN_REVIEW",
    },
    select: {
      id: true,
      representativeName: true,
      position: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      status: true,
      createdAt: true,

      governmentInstitution: {
        select: {
          id: true,
          aisheCode: true,
          name: true,
          state: true,
          district: true,
          website: true,
          universityName: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};


export const approveCollegeApplication = async (
  applicationId: string,
  reviewerId: string
) => {
  // Generate the secret token. Only its hash goes into the database.
  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = getInvitationExpiry();

  // Step 1: Commit the approval and invitation together.
  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.collegeApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error("College application not found");
    }

    if (application.status !== "PENDING_ADMIN_REVIEW") {
      throw new Error("Application is not awaiting admin review");
    }

    if (!application.emailVerifiedAt) {
      throw new Error("Representative email has not been verified");
    }

    const existingCollege = await tx.college.findUnique({
      where: {
        governmentInstitutionId: application.governmentInstitutionId,
      },
    });

    if (existingCollege) {
      throw new Error("This college is already registered");
    }

    const college = await tx.college.create({
      data: {
        governmentInstitutionId: application.governmentInstitutionId,
        verificationStatus: "VERIFIED",
      },
    });

    const invitation = await tx.collegeAdminInvitation.create({
      data: {
        collegeId: college.id,
        email: application.email,
        tokenHash,
        expiresAt,
        createdBy: reviewerId,
      },
    });

    const updatedApplication = await tx.collegeApplication.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: reviewerId,
        action: "COLLEGE_APPLICATION_APPROVED",
        entityType: "CollegeApplication",
        entityId: applicationId,
      },
    });

    return {
      college,
      application: updatedApplication,
      invitationId: invitation.id,
      invitationEmail: application.email,
    };
  });

  // Step 2: Send the email only after the transaction commits.
  const invitationUrl =
    `${env.FRONTEND_URL.replace(/\/$/, "")}` +
    `/accept-college-invitation?token=${encodeURIComponent(token)}`;

  try {
    await sendCollegeAdminInvitationEmail(
      result.invitationEmail,
      invitationUrl
    );

    return {
      college: result.college,
      application: result.application,
      invitationEmailSent: true,
    };
  } catch (error) {
    // Invalidate this token if delivery fails or has an uncertain outcome.
    await prisma.collegeAdminInvitation.update({
      where: { id: result.invitationId },
      data: { expiresAt: new Date() },
    });

    console.error("College Admin invitation email failed:", error);

    return {
      college: result.college,
      application: result.application,
      invitationEmailSent: false,
    };
  }
};



export const rejectCollegeApplication = async (
  applicationId: string,
  reviewerId: string,
  rejectionReason: string
) => {
  const normalizedReason = rejectionReason.trim();

  if (!normalizedReason) {
    throw new Error("Rejection reason is required");
  }

  return prisma.$transaction(async (tx) => {
    const application = await tx.collegeApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error("College application not found");
    }

    if (application.status !== "PENDING_ADMIN_REVIEW") {
      throw new Error("Application is not awaiting admin review");
    }

    const updatedApplication = await tx.collegeApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: normalizedReason,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: reviewerId,
        action: "COLLEGE_APPLICATION_REJECTED",
        entityType: "CollegeApplication",
        entityId: applicationId,
      },
    });

    return updatedApplication;
  });
};

