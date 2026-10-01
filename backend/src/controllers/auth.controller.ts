import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser
} from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/authenticate";

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User with this email already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await loginUser(
      req.body.email,
      req.body.password
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    const user = await getCurrentUser(req.user.userId);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User not found"
    ) {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};