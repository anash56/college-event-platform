import crypto from "crypto";
import bcrypt from "bcrypt";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const SALT_ROUNDS = 10;

export const generateOtp = (): string => {
  const max = 10 ** OTP_LENGTH;

  return crypto
    .randomInt(0, max)
    .toString()
    .padStart(OTP_LENGTH, "0");
};

export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, SALT_ROUNDS);
};

export const verifyOtp = async (
  otp: string,
  otpHash: string
): Promise<boolean> => {
  return bcrypt.compare(otp, otpHash);
};

export const getOtpExpiry = (): Date => {
  return new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );
};