import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { routeParam } from "../utils/params.js";

export async function listNotifications(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const unreadOnly = req.query.unread === "true";

  const items = await prisma.notification.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({ success: true, data: items });
}

export async function markNotificationRead(req: Request, res: Response) {
  await prisma.notification.update({
    where: { id: routeParam(req.params.id) },
    data: { read: true },
  });
  res.json({ success: true, data: { read: true } });
}