import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { routeParam } from "../utils/params.js";

export async function listPlans(_req: Request, res: Response) {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { members: true } } },
  });
  res.json({ success: true, data: plans });
}

export async function createPlan(req: Request, res: Response) {
  const body = req.body as {
    name: string;
    slug: string;
    tier: string;
    billingCycle: string;
    priceCents: number;
    description?: string;
    features?: string[];
    sortOrder?: number;
  };

  const plan = await prisma.membershipPlan.create({
    data: {
      name: body.name,
      slug: body.slug,
      tier: body.tier,
      billingCycle: body.billingCycle as never,
      priceCents: body.priceCents,
      description: body.description,
      features: JSON.stringify(body.features ?? []),
      sortOrder: body.sortOrder ?? 0,
    },
  });

  res.status(201).json({ success: true, data: plan });
}

export async function updatePlan(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const plan = await prisma.membershipPlan.update({
    where: { id: routeParam(req.params.id) },
    data: {
      ...body,
      features:
        body.features !== undefined
          ? JSON.stringify(body.features)
          : undefined,
    },
  });
  res.json({ success: true, data: plan });
}

export async function deletePlan(req: Request, res: Response) {
  const planId = routeParam(req.params.id);
  const count = await prisma.member.count({ where: { planId } });
  if (count > 0) throw new AppError(400, "Cannot delete plan with active members");
  await prisma.membershipPlan.delete({ where: { id: planId } });
  res.json({ success: true, data: { deleted: true } });
}