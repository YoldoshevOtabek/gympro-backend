import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingLocation = await prisma.location.findUnique({
    where: {
      slug: "downtown-flagship",
    },
  });

  if (existingLocation) {
    console.log("Seed already exists. Skipping...");
    return;
  }

  const location = await prisma.location.create({
    data: {
      name: "Downtown Flagship Club",
      slug: "downtown-flagship",
      address: "1200 Market St, San Francisco, CA",
      capacity: 250,
    },
  });

  const [vip, elite, standard, student] = await Promise.all([
    prisma.membershipPlan.create({
      data: {
        name: "VIP All-Access",
        slug: "vip-all-access",
        tier: "VIP",
        billingCycle: "MONTHLY",
        priceCents: 19900,
        sortOrder: 1,
        features: JSON.stringify(["All zones", "Sauna", "Guest passes"]),
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: "Elite Annual",
        slug: "elite-annual",
        tier: "Elite",
        billingCycle: "ANNUAL",
        priceCents: 129000,
        sortOrder: 2,
        features: JSON.stringify(["Classes", "Trainer consult"]),
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: "Standard Monthly",
        slug: "standard-monthly",
        tier: "Standard",
        billingCycle: "MONTHLY",
        priceCents: 7900,
        sortOrder: 3,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: "Student Semester",
        slug: "student-semester",
        tier: "Student",
        billingCycle: "SEMESTER",
        priceCents: 29900,
        sortOrder: 4,
      },
    }),
  ]);

  const passwordHash = await bcrypt.hash("admin123", 12);
  const sarah = await prisma.user.create({
    data: {
      email: "sarah@gympro.local",
      passwordHash,
      fullName: "Sarah Jenkins",
      role: "GENERAL_MANAGER",
      locationId: location.id,
      phone: "+1 415 555 0100",
    },
  });

  const zones = await Promise.all([
    prisma.gymZone.create({
      data: {
        name: "Free Weights Zone",
        slug: "free-weights",
        capacity: 100,
        locationId: location.id,
      },
    }),
    prisma.gymZone.create({
      data: {
        name: "Cardio Deck",
        slug: "cardio",
        capacity: 80,
        locationId: location.id,
      },
    }),
    prisma.gymZone.create({
      data: {
        name: "Studio A (HIIT Velocity)",
        slug: "studio-a",
        capacity: 30,
        locationId: location.id,
      },
    }),
    prisma.gymZone.create({
      data: {
        name: "Recovery & Infrared Sauna",
        slug: "recovery",
        capacity: 20,
        locationId: location.id,
      },
    }),
  ]);

  const trainer = await prisma.trainer.create({
    data: {
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex@gympro.local",
      specialty: "HIIT / CrossFit",
      locationId: location.id,
      hourlyRateCents: 7500,
    },
  });

  const classStart = new Date();
  classStart.setMinutes(0, 0, 0);
  const classEnd = new Date(classStart.getTime() + 60 * 60 * 1000);

  await prisma.scheduleClass.create({
    data: {
      title: "HIIT Velocity",
      trainerId: trainer.id,
      locationId: location.id,
      zoneId: zones[2].id,
      startsAt: classStart,
      endsAt: classEnd,
      capacity: 30,
      status: "IN_SESSION",
    },
  });

  const planPool = [vip, elite, standard, student];
  const firstNames = [
    "Marcus",
    "James",
    "Elena",
    "Priya",
    "Noah",
    "Ava",
    "Liam",
    "Sophia",
    "Ethan",
    "Mia",
  ];
  const lastNames = [
    "Vance",
    "Sterling",
    "Kowalski",
    "Patel",
    "Brooks",
    "Chen",
    "Diaz",
    "Nguyen",
    "Fox",
    "Reed",
  ];

  const members = [];
  for (let i = 0; i < 120; i++) {
    const plan = planPool[i % planPool.length];
    const member = await prisma.member.create({
      data: {
        firstName: firstNames[i % firstNames.length],
        lastName: `${lastNames[i % lastNames.length]}${i > 9 ? i : ""}`,
        email: `member${i + 1}@demo.gympro`,
        phone: `+1 415 555 ${String(1000 + i).padStart(4, "0")}`,
        rfidTag: `RFID-${10000 + i}`,
        planId: plan.id,
        locationId: location.id,
        status:
          i < 95 ? "ACTIVE" : i < 105 ? "PAUSED" : i < 110 ? "GRACE" : "INACTIVE",
        joinedAt: new Date(Date.now() - i * 86400000),
        expiresAt:
          i % 15 === 0
            ? new Date(Date.now() + 36 * 60 * 60 * 1000)
            : new Date(Date.now() + 90 * 86400000),
        autoRenew: i % 4 !== 0,
      },
    });
    members.push(member);

    if (i % 3 === 0) {
      await prisma.payment.create({
        data: {
          memberId: member.id,
          locationId: location.id,
          amountCents: plan.priceCents,
          status: "PAID",
          description: `${plan.name} payment`,
          invoiceNumber: `INV-${2026000 + i}`,
        },
      });
    }
  }

  for (let i = 0; i < 42; i++) {
    await prisma.attendance.create({
      data: {
        memberId: members[i].id,
        locationId: location.id,
        zoneId: zones[i % zones.length].id,
        checkedInAt: new Date(Date.now() - (i % 5) * 600000),
      },
    });
  }

  await prisma.visitor.createMany({
    data: [
      {
        firstName: "Tyler",
        lastName: "Moss",
        interests: "HIIT / CrossFit",
        status: "TRIAL",
        locationId: location.id,
        arrivedAt: new Date(),
      },
      {
        firstName: "Jordan",
        lastName: "Lee",
        interests: "Recovery / Sauna",
        status: "DROP_IN",
        locationId: location.id,
        arrivedAt: new Date(Date.now() - 2 * 3600000),
      },
    ],
  });

  await prisma.equipment.createMany({
    data: [
      {
        name: "Rogue Power Rack",
        category: "Strength",
        status: "OPERATIONAL",
        locationId: location.id,
      },
      {
        name: "Peloton Tread",
        category: "Cardio",
        status: "OPERATIONAL",
        locationId: location.id,
      },
      {
        name: "Concept2 Rower",
        category: "Cardio",
        status: "MAINTENANCE",
        locationId: location.id,
      },
    ],
  });

  const year = new Date().getFullYear();
  const monthly = [
    [42000, 38000, 28000],
    [44000, 39500, 29000],
    [46000, 41000, 30000],
    [48000, 43000, 31000],
    [50000, 45000, 32000],
    [52000, 47000, 33000],
    [54000, 49000, 34000],
    [56000, 51000, 35000],
    [58000, 53000, 36000],
    [60000, 55000, 37000],
    [62000, 57000, 38000],
    [64000, 59000, 39000],
  ];

  for (let m = 0; m < 12; m++) {
    const [vipCents, eliteCents, standardCents] = monthly[m];
    await prisma.revenueMonthly.create({
      data: {
        year,
        month: m + 1,
        vipCents,
        eliteCents,
        standardCents,
        totalCents: vipCents + eliteCents + standardCents,
      },
    });
  }

  const occupancyCurve = [12, 18, 28, 35, 42, 55, 68, 74, 70, 58, 40, 22];
  for (let h = 6; h <= 22; h++) {
    const percent = occupancyCurve[h - 6] ?? 30;
    const checkedIn = Math.round((percent / 100) * location.capacity);
    await prisma.occupancyHourly.create({
      data: {
        locationId: location.id,
        hour: h,
        percent,
        checkedIn,
        recordedFor: new Date(),
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: sarah.id,
      type: "MEMBERSHIP_EXPIRING",
      title: "3 memberships expiring in 48h",
      body: "Review retention queue and trigger auto-renew where eligible.",
    },
  });

  await prisma.setting.createMany({
    data: [
      { locationId: location.id, key: "brand_name", value: "GYMPRO" },
      { locationId: location.id, key: "mtd_new_member_goal", value: "160" },
      { locationId: null, key: "default_currency", value: "USD" },
    ],
  });

  console.log("Seed complete.");
  console.log("Login: sarah@gympro.local / admin123");
  console.log(`Location ID: ${location.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());