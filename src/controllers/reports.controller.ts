import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { centsToDecimal } from "../utils/money.js";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
}

export async function membersReport(req: Request, res: Response) {
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;
  const format = (req.query.format as string) ?? "json";

  const members = await prisma.member.findMany({
    where: locationId ? { locationId } : {},
    include: { plan: true, location: true },
    orderBy: { joinedAt: "desc" },
  });

  const rows = members.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    email: m.email,
    phone: m.phone ?? "",
    plan: m.plan.name,
    status: m.status,
    location: m.location.name,
    joinedAt: m.joinedAt.toISOString(),
  }));

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="members-report.csv"'
    );
    res.send(toCsv(rows));
    return;
  }

  res.json({ success: true, data: rows });
}

export async function revenueReport(req: Request, res: Response) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const data = await prisma.revenueMonthly.findMany({
    where: { year },
    orderBy: { month: "asc" },
  });

  res.json({
    success: true,
    data: data.map((r) => ({
      month: r.month,
      vip: centsToDecimal(r.vipCents),
      elite: centsToDecimal(r.eliteCents),
      standard: centsToDecimal(r.standardCents),
      total: centsToDecimal(r.totalCents),
    })),
  });
}

export async function attendanceReport(req: Request, res: Response) {
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId;
  const from = req.query.from
    ? new Date(String(req.query.from))
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();

  const records = await prisma.attendance.findMany({
    where: {
      ...(locationId ? { locationId } : {}),
      checkedInAt: { gte: from, lte: to },
    },
    include: { member: true },
    orderBy: { checkedInAt: "desc" },
  });

  res.json({
    success: true,
    data: {
      totalVisits: records.length,
      uniqueMembers: new Set(records.map((r) => r.memberId)).size,
      records,
    },
  });
}