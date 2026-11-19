import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import { routeParam } from "../utils/params.js";

export async function listTrainers(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;

  const where = {
    ...(locationId ? { locationId } : {}),
    isActive: true,
  };

  const [items, total] = await Promise.all([
    prisma.trainer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastName: "asc" },
      include: { _count: { select: { classes: true } } },
    }),
    prisma.trainer.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: paginationMeta(total, page, limit) });
}

export async function createTrainer(req: Request, res: Response) {
  const body = req.body as {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    specialty?: string;
    bio?: string;
    hourlyRateCents?: number;
    locationId: string;
  };

  const trainer = await prisma.trainer.create({ data: body });
  res.status(201).json({ success: true, data: trainer });
}

export async function updateTrainer(req: Request, res: Response) {
  const trainer = await prisma.trainer.update({
    where: { id: routeParam(req.params.id) },
    data: req.body,
  });
  res.json({ success: true, data: trainer });
}

export async function deleteTrainer(req: Request, res: Response) {
  const id = routeParam(req.params.id);
  const trainer = await prisma.trainer.findUnique({ where: { id } });
  if (!trainer) throw new AppError(404, "Trainer not found");
  await prisma.trainer.update({
    where: { id: routeParam(req.params.id) },
    data: { isActive: false },
  });
  res.json({ success: true, data: { deleted: true } });
}