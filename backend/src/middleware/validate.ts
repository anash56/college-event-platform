import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type ValidationSource = "body" | "query" | "params";

export const validate = (
  schema: ZodSchema,
  source: ValidationSource = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];

    const result = schema.safeParse(data);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });

      return;
    }

    if (source === "body") {
      req.body = result.data;
    }

    next();
  };
};