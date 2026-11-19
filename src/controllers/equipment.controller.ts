import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import { routeParam } from "../utils/params.js";

export async function listEquipment(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;

  const where = locationId ? { locationId } : {};

  const [items, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.equipment.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: paginationMeta(total, page, limit) });
}

export async function createEquipment(req: Request, res: Response) {
  const body = req.body as {
    name: string;
    category: string;
    serialNumber?: string;
    status?: string;
    locationId: string;
    lastMaintained?: string;
    notes?: string;
  };

  const item = await prisma.equipment.create({
    data: {
      name: body.name,
      category: body.category,
      serialNumber: body.serialNumber,
      status: (body.status as never) ?? "OPERATIONAL",
      locationId: body.locationId,
      lastMaintained: body.lastMaintained
        ? new Date(body.lastMaintained)
        : undefined,
      notes: body.notes,
    },
  });

  res.status(201).json({ success: true, data: item });
}

export async function updateEquipment(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const item = await prisma.equipment.update({
    where: { id: routeParam(req.params.id) },
    data: {
      ...body,
      lastMaintained:
        typeof body.lastMaintained === "string"
          ? new Date(body.lastMaintained)
          : undefined,
    },
  });
  res.json({ success: true, data: item });
}

export async function deleteEquipment(req: Request, res: Response) {
  await prisma.equipment.delete({ where: { id: routeParam(req.params.id) } });
  res.json({ success: true, data: { deleted: true } });
}