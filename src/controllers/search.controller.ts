import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function globalSearch(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.json({ success: true, data: { members: [], plans: [] } });
    return;
  }

  const locationId = req.locationId;

  const [members, plans] = await Promise.all([
    prisma.member.findMany({
      where: {
        ...(locationId ? { locationId } : {}),
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
          { rfidTag: { contains: q } },
        ],
      },
      take: 10,
      include: { plan: true },
    }),
    prisma.membershipPlan.findMany({
      where: {
        OR: [{ name: { contains: q } }, { tier: { contains: q } }],
      },
      take: 5,
    }),
  ]);

  res.json({
    success: true,
    data: {
      members: members.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        email: m.email,
        plan: m.plan.name,
        status: m.status,
      })),
      plans,
    },
  });
}