import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
  console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      message:
        env.nodeEnv === "production"
          ? "Internal server error"
          : err instanceof Error
            ? err.message
            : "Unknown error",
    },
  });
}