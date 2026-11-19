import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";

export async function listAttendance(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;

  const where = locationId ? { locationId } : {};

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { checkedInAt: "desc" },
      include: { member: true, zone: true },
    }),
    prisma.attendance.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: paginationMeta(total, page, limit) });
}

export async function checkIn(req: Request, res: Response) {
  const body = req.body as {
    memberId?: string;
    rfidTag?: string;
    locationId: string;
    zoneId?: string;
  };

  let memberId = body.memberId;
  if (!memberId && body.rfidTag) {
    const member = await prisma.member.findFirst({
      where: { rfidTag: body.rfidTag, locationId: body.locationId },
    });
    if (!member) throw new AppError(404, "Member not found for RFID");
    memberId = member.id;
  }
  if (!memberId) throw new AppError(400, "memberId or rfidTag required");

  const open = await prisma.attendance.findFirst({
    where: { memberId, checkedOutAt: null },
  });
  if (open) throw new AppError(400, "Member already checked in");

  const record = await prisma.attendance.create({
    data: {
      memberId,
      locationId: body.locationId,
      zoneId: body.zoneId,
    },
    include: { member: true, zone: true },
  });

  res.status(201).json({ success: true, data: record });
}

export async function checkOut(req: Request, res: Response) {
  const { memberId, attendanceId } = req.body as {
    memberId?: string;
    attendanceId?: string;
  };

  const record = attendanceId
    ? await prisma.attendance.findUnique({ where: { id: attendanceId } })
    : await prisma.attendance.findFirst({
        where: { memberId, checkedOutAt: null },
        orderBy: { checkedInAt: "desc" },
      });

  if (!record) throw new AppError(404, "No active check-in found");
  if (record.checkedOutAt) throw new AppError(400, "Already checked out");

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { checkedOutAt: new Date() },
    include: { member: true },
  });

  res.json({ success: true, data: updated });
}

export async function attendanceLive(req: Request, res: Response) {
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;
  if (!locationId) throw new AppError(400, "locationId required");

  const [checkedIn, location] = await Promise.all([
    prisma.attendance.findMany({
      where: { locationId, checkedOutAt: null },
      include: { member: { include: { plan: true } }, zone: true },
    }),
    prisma.location.findUnique({ where: { id: locationId } }),
  ]);

  const capacity = location?.capacity ?? 250;

  res.json({
    success: true,
    data: {
      checkedInCount: checkedIn.length,
      capacity,
      percentFull: Math.round((checkedIn.length / capacity) * 1000) / 10,
      members: checkedIn,
    },
  });
}