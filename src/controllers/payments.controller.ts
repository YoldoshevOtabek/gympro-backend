import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import { centsToDecimal } from "../utils/money.js";

export async function listPayments(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;
  const memberId =
    typeof req.query.memberId === "string" ? req.query.memberId : undefined;

  const where = {
    ...(locationId ? { locationId } : {}),
    ...(memberId ? { memberId } : {}),
  };

  const [items, total, sum] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paidAt: "desc" },
      include: { member: true, location: true },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: { ...where, status: "PAID" },
      _sum: { amountCents: true },
    }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      ...paginationMeta(total, page, limit),
      totalPaid: centsToDecimal(sum._sum.amountCents ?? 0),
    },
  });
}

export async function createPayment(req: Request, res: Response) {
  const body = req.body as {
    memberId: string;
    locationId: string;
    amountCents: number;
    status?: string;
    description?: string;
    invoiceNumber?: string;
  };

  const payment = await prisma.payment.create({
    data: {
      memberId: body.memberId,
      locationId: body.locationId,
      amountCents: body.amountCents,
      status: (body.status as never) ?? "PAID",
      description: body.description,
      invoiceNumber: body.invoiceNumber,
    },
    include: { member: true },
  });

  res.status(201).json({ success: true, data: payment });
}

export async function billingSummary(req: Request, res: Response) {
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthPayments, pendingCount, failedCount, activeSubs] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        ...(locationId ? { locationId } : {}),
        status: "PAID",
        paidAt: { gte: monthStart },
      },
      _sum: { amountCents: true },
    }),
    prisma.payment.count({
      where: { ...(locationId ? { locationId } : {}), status: "PENDING" },
    }),
    prisma.payment.count({
      where: { ...(locationId ? { locationId } : {}), status: "FAILED" },
    }),
    prisma.member.count({
      where: {
        ...(locationId ? { locationId } : {}),
        status: { in: ["ACTIVE", "GRACE"] },
        autoRenew: true,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      collectedThisMonth: centsToDecimal(monthPayments._sum.amountCents ?? 0),
      pendingInvoices: pendingCount,
      failedPayments: failedCount,
      autoRenewSubscriptions: activeSubs,
    },
  });
}