import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import type { UserRole } from "@prisma/client";

export type AuthPayload = {
  userId: string;
  role: UserRole;
  locationId?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
      locationId?: string;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload & {
      type?: string;
    };
    if (decoded.type && decoded.type !== "access") {
      return next(new AppError(401, "Access token required"));
    }
    req.auth = {
      userId: decoded.userId,
      role: decoded.role,
      locationId: decoded.locationId,
    };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AppError(401, "Authentication required"));
    }
    if (!roles.includes(req.auth.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }
    next();
  };
}

export function resolveLocation(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const fromHeader = req.headers["x-location-id"];
  const fromQuery =
    typeof req.query.locationId === "string" ? req.query.locationId : undefined;
  req.locationId =
    (Array.isArray(fromHeader) ? fromHeader[0] : fromHeader) ??
    fromQuery ??
    req.auth?.locationId ??
    undefined;
  next();
}