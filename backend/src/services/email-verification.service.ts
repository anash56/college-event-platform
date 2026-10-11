
import { prisma } from "../lib/prisma";
import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  verifyOtp,
} from "../utils/otp";
import { sendVerificationEmail } from "./email.service";

// Create or refresh an OTP for an email address.
export const createOrRefreshEmailVerification = async (
  email: string
): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = getOtpExpiry();

  await prisma.emailVerification.upsert({
    where: {
      email: normalizedEmail,
    },
    update: {
      otpHash,
      expiresAt,
      attempts: 0,
    },
    create: {
      email: normalizedEmail,
      otpHash,
      expiresAt,
    },
  });

  await sendVerificationEmail(normalizedEmail, otp);
};

// Validate an OTP and persist failed attempts outside any
// transaction that throws, so the attempt count is not rolled back.
const validateOtpOrRecordFailure = async (
  email: string,
  otp: string
): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();

  const verification = await prisma.emailVerification.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!verification) {
    throw new Error("Verification request not found");
  }

  if (verification.expiresAt <= new Date()) {
    throw new Error("OTP has expired");
  }

  if (verification.attempts >= 5) {
    throw new Error("Too many invalid attempts");
  }

  const isValid = await verifyOtp(otp, verification.otpHash);

  if (!isValid) {
    const result = await prisma.emailVerification.updateMany({
      where: {
        id: verification.id,
        otpHash: verification.otpHash,
        attempts: {
          lt: 5,
        },
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      const currentVerification =
        await prisma.emailVerification.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (!currentVerification) {
        throw new Error("Verification request not found");
      }

      if (currentVerification.attempts >= 5) {
        throw new Error("Too many invalid attempts");
      }
    }

    throw new Error("Invalid OTP");
  }
};

// Generic OTP verification for callers that only need to consume an OTP.
export const verifyEmailOtp = async (
  email: string,
  otp: string
): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();

  await validateOtpOrRecordFailure(normalizedEmail, otp);

  await prisma.$transaction(async (tx) => {
    const verification = await tx.emailVerification.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (
      !verification ||
      verification.expiresAt <= new Date() ||
      verification.attempts >= 5
    ) {
      throw new Error(
        "Verification request changed or expired. Please request a new OTP."
      );
    }

    const isValid = await verifyOtp(otp, verification.otpHash);

    if (!isValid) {
      throw new Error(
        "Verification request changed. Please request a new OTP."
      );
    }

    await tx.emailVerification.delete({
      where: {
        id: verification.id,
      },
    });
  });
};

// Verify a registered user's email and consume the OTP atomically.
export const verifyUserEmail = async (
  userId: string,
  otp: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  const email = user.email.trim().toLowerCase();

  await validateOtpOrRecordFailure(email, otp);

  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
        emailVerified: true,
      },
    });

    if (!currentUser) {
      throw new Error("User not found");
    }

    if (currentUser.emailVerified) {
      throw new Error("Email is already verified");
    }

    if (currentUser.email.trim().toLowerCase() !== email) {
      throw new Error("User email has changed");
    }

    const verification = await tx.emailVerification.findUnique({
      where: {
        email,
      },
    });

    if (
      !verification ||
      verification.expiresAt <= new Date() ||
      verification.attempts >= 5
    ) {
      throw new Error(
        "Verification request changed or expired. Please request a new OTP."
      );
    }

    const isValid = await verifyOtp(otp, verification.otpHash);

    if (!isValid) {
      throw new Error(
        "Verification request changed. Please request a new OTP."
      );
    }

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerified: true,
      },
    });

    await tx.emailVerification.delete({
      where: {
        id: verification.id,
      },
    });
  });
};

// Verify a college representative's email and update the application atomically.
export const verifyCollegeApplicationEmail = async (
  applicationId: string,
  otp: string
): Promise<void> => {
  const application = await prisma.collegeApplication.findUnique({
    where: {
      id: applicationId,
    },
    select: {
      email: true,
      status: true,
    },
  });

  if (!application) {
    throw new Error("College application not found");
  }

  if (application.status !== "PENDING_EMAIL_VERIFICATION") {
    throw new Error("Application is not awaiting email verification");
  }

  const email = application.email.trim().toLowerCase();

  await validateOtpOrRecordFailure(email, otp);

  await prisma.$transaction(async (tx) => {
    const currentApplication = await tx.collegeApplication.findUnique({
      where: {
        id: applicationId,
      },
      select: {
        email: true,
        status: true,
      },
    });

    if (!currentApplication) {
      throw new Error("College application not found");
    }

    if (
      currentApplication.status !== "PENDING_EMAIL_VERIFICATION"
    ) {
      throw new Error(
        "Application is not awaiting email verification"
      );
    }

    if (currentApplication.email.trim().toLowerCase() !== email) {
      throw new Error("Application email has changed");
    }

    const verification = await tx.emailVerification.findUnique({
      where: {
        email,
      },
    });

    if (
      !verification ||
      verification.expiresAt <= new Date() ||
      verification.attempts >= 5
    ) {
      throw new Error(
        "Verification request changed or expired. Please request a new OTP."
      );
    }

    const isValid = await verifyOtp(otp, verification.otpHash);

    if (!isValid) {
      throw new Error(
        "Verification request changed. Please request a new OTP."
      );
    }

    await tx.collegeApplication.update({
      where: {
        id: applicationId,
      },
      data: {
        emailVerifiedAt: new Date(),
        status: "PENDING_ADMIN_REVIEW",
      },
    });

    await tx.emailVerification.delete({
      where: {
        id: verification.id,
      },
    });
  });
};

// Resend OTP for an unverified user.
export const resendVerificationEmail = async (
  userId: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  await createOrRefreshEmailVerification(user.email);
};

// Resend OTP for a college application awaiting email verification.
export const resendCollegeApplicationVerificationEmail = async (
  applicationId: string
): Promise<void> => {
  const application = await prisma.collegeApplication.findUnique({
    where: {
      id: applicationId,
    },
    select: {
      email: true,
      status: true,
    },
  });

  if (!application) {
    throw new Error("College application not found");
  }

  if (application.status !== "PENDING_EMAIL_VERIFICATION") {
    throw new Error(
      "Application is not awaiting email verification"
    );
  }

  await createOrRefreshEmailVerification(application.email);
};
