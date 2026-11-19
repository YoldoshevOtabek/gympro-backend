import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import { routeParam } from "../utils/params.js";

export async function listVisitors(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;

  const where = locationId ? { locationId } : {};

  const [items, total] = await Promise.all([
    prisma.visitor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { arrivedAt: "desc" },
      include: { location: true, member: true },
    }),
    prisma.visitor.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: paginationMeta(total, page, limit) });
}

export async function createVisitor(req: Request, res: Response) {
  const body = req.body as {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    interests?: string;
    status?: string;
    locationId: string;
    notes?: string;
  };

  const visitor = await prisma.visitor.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      interests: body.interests,
      status: (body.status as never) ?? "TRIAL",
      locationId: body.locationId,
      notes: body.notes,
    },
  });

  res.status(201).json({ success: true, data: visitor });
}

export async function convertVisitor(req: Request, res: Response) {
  const visitor = await prisma.visitor.findUnique({
    where: { id: routeParam(req.params.id) },
  });
  if (!visitor) throw new AppError(404, "Visitor not found");
  if (visitor.status === "CONVERTED") {
    throw new AppError(400, "Visitor already converted");
  }

  const { planId, email } = req.body as { planId: string; email?: string };

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.member.create({
      data: {
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        email: (email ?? visitor.email ?? `${visitor.id}@lead.local`).toLowerCase(),
        phone: visitor.phone,
        planId,
        locationId: visitor.locationId,
        visitorId: visitor.id,
      },
    });
    await tx.visitor.update({
      where: { id: visitor.id },
      data: { status: "CONVERTED", convertedAt: new Date() },
    });
    return created;
  });

  res.json({ success: true, data: { member } });
}