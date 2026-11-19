import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import { routeParam } from "../utils/params.js";

export async function listMembers(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const planId = typeof req.query.planId === "string" ? req.query.planId : undefined;
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;

  const where = {
    ...(locationId ? { locationId } : {}),
    ...(status ? { status: status as never } : {}),
    ...(planId ? { planId } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { rfidTag: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: limit,
      orderBy: { joinedAt: "desc" },
      include: { plan: true, location: true },
    }),
    prisma.member.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: paginationMeta(total, page, limit),
  });
}

export async function getMember(req: Request, res: Response) {
  const member = await prisma.member.findUnique({
    where: { id: routeParam(req.params.id) },
    include: {
      plan: true,
      location: true,
      payments: { orderBy: { paidAt: "desc" }, take: 20 },
      attendances: { orderBy: { checkedInAt: "desc" }, take: 20 },
    },
  });
  if (!member) throw new AppError(404, "Member not found");
  res.json({ success: true, data: member });
}

export async function createMember(req: Request, res: Response) {
  const data = req.body as {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    rfidTag?: string;
    planId: string;
    locationId: string;
    status?: string;
    autoRenew?: boolean;
    expiresAt?: string;
    notes?: string;
  };

  const member = await prisma.member.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      rfidTag: data.rfidTag,
      planId: data.planId,
      locationId: data.locationId,
      status: (data.status as never) ?? "ACTIVE",
      autoRenew: data.autoRenew ?? true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      notes: data.notes,
    },
    include: { plan: true },
  });

  res.status(201).json({ success: true, data: member });
}

export async function updateMember(req: Request, res: Response) {
  const id = routeParam(req.params.id);
  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Member not found");

  const data = req.body as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    rfidTag?: string;
    planId?: string;
    locationId?: string;
    status?: string;
    autoRenew?: boolean;
    expiresAt?: string;
    pausedUntil?: string;
    notes?: string;
  };

  const member = await prisma.member.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      rfidTag: data.rfidTag,
      planId: data.planId,
      locationId: data.locationId,
      status: data.status as never | undefined,
      autoRenew: data.autoRenew,
      notes: data.notes,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      pausedUntil: data.pausedUntil ? new Date(data.pausedUntil) : undefined,
    },
    include: { plan: true },
  });

  res.json({ success: true, data: member });
}

export async function deleteMember(req: Request, res: Response) {
  await prisma.member.delete({ where: { id: routeParam(req.params.id) } });
  res.json({ success: true, data: { deleted: true } });
}