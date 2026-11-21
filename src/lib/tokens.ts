import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthPayload } from "../middleware/auth.js";
import { prisma } from "./prisma.js";

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createRefreshTokenValue(): string {
  return randomBytes(48).toString("base64url");
}

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(
    { ...payload, type: "access" as const },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions["expiresIn"] }
  );
}

export function accessTokenTtlSeconds(): number {
  return parseDurationToSeconds(env.jwtAccessExpiresIn);
}

export function refreshTokenTtlSeconds(): number {
  return parseDurationToSeconds(env.jwtRefreshExpiresIn);
}

function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 3600;
  const n = Number(match[1]);
  const unit = match[2];
  const mult =
    unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return n * mult;
}

export async function issueTokenPair(payload: AuthPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = createRefreshTokenValue();
  const expiresAt = new Date(
    Date.now() + refreshTokenTtlSeconds() * 1000
  );

  await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenTtlSeconds(),
    refreshExpiresIn: refreshTokenTtlSeconds(),
  };
}

export async function revokeRefreshToken(plainToken: string) {
  const tokenHash = hashRefreshToken(plainToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function rotateRefreshToken(plainToken: string) {
  const tokenHash = hashRefreshToken(plainToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt) return null;
  if (stored.expiresAt < new Date()) return null;

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair({
    userId: stored.user.id,
    role: stored.user.role,
    locationId: stored.user.locationId,
  });

  return { ...tokens, userId: stored.user.id };
}