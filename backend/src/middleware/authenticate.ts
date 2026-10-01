import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UserRole } from "../../generated/prisma/enums";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required"
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required"
    });
    return;
  }

  try {
    const payload = verifyToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};