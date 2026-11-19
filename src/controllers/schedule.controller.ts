import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import { routeParam } from "../utils/params.js";

export async function listClasses(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;

  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : new Date();
  const to =
    typeof req.query.to === "string"
      ? new Date(req.query.to)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const where = {
    ...(locationId ? { locationId } : {}),
    startsAt: { gte: from, lte: to },
  };

  const [items, total] = await Promise.all([
    prisma.scheduleClass.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startsAt: "asc" },
      include: {
        trainer: true,
        zone: true,
        _count: { select: { bookings: true } },
      },
    }),
    prisma.scheduleClass.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: paginationMeta(total, page, limit) });
}

export async function createClass(req: Request, res: Response) {
  const body = req.body as {
    title: string;
    description?: string;
    trainerId?: string;
    locationId: string;
    zoneId?: string;
    startsAt: string;
    endsAt: string;
    capacity?: number;
    status?: string;
  };

  const cls = await prisma.scheduleClass.create({
    data: {
      title: body.title,
      description: body.description,
      trainerId: body.trainerId,
      locationId: body.locationId,
      zoneId: body.zoneId,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      capacity: body.capacity ?? 30,
      status: (body.status as never) ?? "SCHEDULED",
    },
    include: { trainer: true, zone: true },
  });

  res.status(201).json({ success: true, data: cls });
}

export async function bookClass(req: Request, res: Response) {
  const classId = routeParam(req.params.id);
  const { memberId } = req.body as { memberId: string };

  const cls = await prisma.scheduleClass.findUnique({
    where: { id: classId },
    include: { _count: { select: { bookings: true } } },
  });
  if (!cls) throw new AppError(404, "Class not found");
  if (cls._count.bookings >= cls.capacity) {
    throw new AppError(400, "Class is full");
  }

  const booking = await prisma.classBooking.create({
    data: { classId, memberId },
  });

  res.status(201).json({ success: true, data: booking });
}

export async function updateClassStatus(req: Request, res: Response) {
  const { status } = req.body as { status: string };
  const cls = await prisma.scheduleClass.update({
    where: { id: routeParam(req.params.id) },
    data: { status: status as never },
  });
  res.json({ success: true, data: cls });
}