import { prisma } from "../lib/prisma";
import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  verifyOtp
} from "../utils/otp";
import { sendVerificationEmail } from "./email.service";

export const createOrRefreshEmailVerification = async (
  userId: string,
  email: string
): Promise<void> => {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = getOtpExpiry();

  await prisma.emailVerification.upsert({
    where: {
      userId
    },
    update: {
      otpHash,
      expiresAt,
      attempts: 0
    },
    create: {
      userId,
      otpHash,
      expiresAt
    }
  });

  await sendVerificationEmail(email, otp);
};

export const verifyEmail = async (
  userId: string,
  otp: string
): Promise<void> => {
  const verification = await prisma.emailVerification.findUnique({
    where: {
      userId
    }
  });

  if (!verification) {
    throw new Error("Verification request not found");
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("OTP has expired");
  }

  if (verification.attempts >= 5) {
    throw new Error("Too many invalid attempts");
  }

  const isValid = await verifyOtp(
    otp,
    verification.otpHash
  );

  if (!isValid) {
    await prisma.emailVerification.update({
      where: {
        userId
      },
      data: {
        attempts: {
          increment: 1
        }
      }
    });

    throw new Error("Invalid OTP");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId
      },
      data: {
        emailVerified: true
      }
    }),

    prisma.emailVerification.delete({
      where: {
        userId
      }
    })
  ]);
};

export const resendVerificationEmail = async (
  userId: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      email: true,
      emailVerified: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  await createOrRefreshEmailVerification(
    userId,
    user.email
  );
};