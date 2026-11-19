import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import type { AuthPayload } from "../middleware/auth.js";

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { location: true },
  });
  if (!user) throw new AppError(401, "Invalid email or password");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError(401, "Invalid email or password");

  const token = signToken({
    userId: user.id,
    role: user.role,
    locationId: user.locationId,
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        location: user.location,
      },
    },
  });
}

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: { location: true },
  });
  if (!user) throw new AppError(404, "User not found");
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      location: user.location,
    },
  });
}

export async function bootstrapAdmin(req: Request, res: Response) {
  if (env.nodeEnv === "production") {
    throw new AppError(403, "Bootstrap disabled in production");
  }
  const count = await prisma.user.count();
  if (count > 0) throw new AppError(400, "Admin already exists");

  const body = req.body as {
    email: string;
    password: string;
    fullName: string;
    locationId?: string;
  };
  const hash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      passwordHash: hash,
      fullName: body.fullName,
      role: "ADMIN",
      locationId: body.locationId,
    },
  });
  const token = signToken({
    userId: user.id,
    role: user.role,
    locationId: user.locationId,
  });
  res.status(201).json({ success: true, data: { token, userId: user.id } });
}