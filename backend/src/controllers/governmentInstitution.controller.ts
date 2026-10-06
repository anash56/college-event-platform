import { Request, Response } from "express";
import { searchInstitutions } from "../services/governmentInstitution.service";

export const searchInstitutionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const query = req.query.q as string;

    const institutions = await searchInstitutions(query);

    return res.status(200).json({
      institutions,
    });
  } catch (error) {
    console.error(
      "Failed to search government institutions:",
      error
    );

    return res.status(500).json({
      message: "Failed to search institutions",
    });
  }
};