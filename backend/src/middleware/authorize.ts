import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate";
import { UserRole } from "../../generated/prisma/enums";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action"
      });
      return;
    }

    next();
  };
};