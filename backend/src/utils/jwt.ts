import jwt from "jsonwebtoken";
import { env } from "../config/env";

import { UserRole } from "../../generated/prisma/enums";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }

  return decoded as JwtPayload;
};