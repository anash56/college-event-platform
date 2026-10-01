import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";

export const testCollegeAdminAccess = (
  _req: AuthenticatedRequest,
  res: Response
): void => {
  res.status(200).json({
    success: true,
    message: "College Admin access granted"
  });
};