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
  const isProd = env.nodeEnv === "production";
  let message = "Internal server error";
  if (!isProd && err instanceof Error) {
    message = err.message;
  } else if (
    isProd &&
    err instanceof Error &&
    /DATABASE_URL|datasource|prisma/i.test(err.message)
  ) {
    message =
      "Database is not configured. On Render, attach a PostgreSQL database and set DATABASE_URL.";
  }
  return res.status(500).json({
    success: false,
    error: { message },
  });
}