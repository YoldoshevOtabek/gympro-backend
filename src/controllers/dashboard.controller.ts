import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { centsToDecimal } from "../utils/money.js";

async function defaultLocationId(preferred?: string) {
  if (preferred) {
    const loc = await prisma.location.findUnique({ where: { id: preferred } });
    if (loc) return loc.id;
  }
  const first = await prisma.location.findFirst({ where: { isActive: true } });
  if (!first) throw new AppError(404, "No location configured");
  return first.id;
}

export async function getDashboardOverview(req: Request, res: Response) {
  const locationId = await defaultLocationId(req.locationId);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalMembers,
    activeMembers,
    pausedMembers,
    graceMembers,
    newThisMonth,
    newPrevMonth,
    mrrAgg,
    checkedInNow,
    location,
    recentRegistrations,
    expiringSoon,
    visitorsToday,
    revenueTrend,
    occupancyToday,
    zones,
  ] = await Promise.all([
    prisma.member.count({ where: { locationId } }),
    prisma.member.count({ where: { locationId, status: "ACTIVE" } }),
    prisma.member.count({ where: { locationId, status: "PAUSED" } }),
    prisma.member.count({ where: { locationId, status: "GRACE" } }),
    prisma.member.count({
      where: { locationId, joinedAt: { gte: monthStart } },
    }),
    prisma.member.count({
      where: {
        locationId,
        joinedAt: { gte: prevMonthStart, lt: monthStart },
      },
    }),
    prisma.member.findMany({
      where: { locationId, status: { in: ["ACTIVE", "GRACE"] } },
      include: { plan: true },
    }),
    prisma.attendance.count({
      where: { locationId, checkedOutAt: null },
    }),
    prisma.location.findUnique({ where: { id: locationId } }),
    prisma.member.findMany({
      where: { locationId },
      orderBy: { joinedAt: "desc" },
      take: 8,
      include: { plan: true },
    }),
    prisma.member.findMany({
      where: {
        locationId,
        status: { in: ["ACTIVE", "GRACE"] },
        expiresAt: {
          gte: now,
          lte: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        },
      },
      include: { plan: true },
      take: 10,
    }),
    prisma.visitor.findMany({
      where: {
        locationId,
        arrivedAt: { gte: todayStart },
      },
      orderBy: { arrivedAt: "desc" },
      take: 10,
    }),
    prisma.revenueMonthly.findMany({
      orderBy: [{ year: "asc" }, { month: "asc" }],
      take: 12,
    }),
    prisma.occupancyHourly.findMany({
      where: { locationId },
      orderBy: { hour: "asc" },
    }),
    prisma.gymZone.findMany({
      where: { locationId },
      include: {
        attendances: {
          where: { checkedOutAt: null },
        },
        classes: {
          where: { status: "IN_SESSION" },
          include: { _count: { select: { bookings: true } } },
        },
      },
    }),
  ]);

  const mrrCents = mrrAgg.reduce((sum, m) => {
    const monthly =
      m.plan.billingCycle === "MONTHLY"
        ? m.plan.priceCents
        : Math.round(m.plan.priceCents / 12);
    return sum + monthly;
  }, 0);

  const momGrowth =
    newPrevMonth === 0
      ? newThisMonth > 0
        ? 100
        : 0
      : ((newThisMonth - newPrevMonth) / newPrevMonth) * 100;

  const capacity = location?.capacity ?? 250;
  const occupancyPercent = Math.round((checkedInNow / capacity) * 1000) / 10;

  res.json({
    success: true,
    data: {
      location,
      kpis: {
        totalMembers,
        totalMembersMomPercent: Math.round(momGrowth * 10) / 10,
        activeMembers,
        activeRatePercent:
          totalMembers === 0
            ? 0
            : Math.round((activeMembers / totalMembers) * 1000) / 10,
        pausedMembers,
        graceMembers,
        newMembersMtd: newThisMonth,
        newMembersGoal: 160,
        mrr: centsToDecimal(mrrCents),
        arr: centsToDecimal(mrrCents * 12),
        checkedInNow,
        occupancyPercent,
        capacity,
      },
      recentRegistrations: recentRegistrations.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        email: m.email,
        plan: m.plan.name,
        tier: m.plan.tier,
        joinedAt: m.joinedAt,
        amount: m.plan.priceCents,
        billingCycle: m.plan.billingCycle,
        status: m.status,
      })),
      retentionAlerts: expiringSoon.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        plan: m.plan.name,
        expiresAt: m.expiresAt,
        autoRenew: m.autoRenew,
        phone: m.phone,
      })),
      visitorTrialsToday: visitorsToday.map((v) => ({
        id: v.id,
        name: `${v.firstName} ${v.lastName}`,
        interests: v.interests,
        status: v.status,
        arrivedAt: v.arrivedAt,
      })),
      revenueVelocity: revenueTrend.map((r) => ({
        year: r.year,
        month: r.month,
        vip: centsToDecimal(r.vipCents),
        elite: centsToDecimal(r.eliteCents),
        standard: centsToDecimal(r.standardCents),
        total: centsToDecimal(r.totalCents),
      })),
      peakOccupancyByHour: occupancyToday.map((o) => ({
        hour: o.hour,
        percent: o.percent,
        checkedIn: o.checkedIn,
      })),
      zoneStatus: zones.map((z) => {
        const occupied = z.attendances.length;
        const inSession = z.classes[0];
        return {
          id: z.id,
          name: z.name,
          capacity: z.capacity,
          occupied,
          percent: Math.round((occupied / z.capacity) * 1000) / 10,
          classInSession: inSession
            ? {
                title: inSession.title,
                bookings: inSession._count.bookings,
                capacity: inSession.capacity,
              }
            : null,
        };
      }),
      growthInsight: {
        planUpgradesPercent: 24,
        note: "Members upgrading from Standard to VIP tiers",
      },
    },
  });
}