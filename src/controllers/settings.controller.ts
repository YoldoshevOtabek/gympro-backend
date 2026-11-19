import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listSettings(req: Request, res: Response) {
  const locationId =
    (typeof req.query.locationId === "string" ? req.query.locationId : undefined) ??
    req.locationId ??
    null;

  const settings = await prisma.setting.findMany({
    where: { locationId },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  res.json({ success: true, data: map });
}

export async function upsertSettings(req: Request, res: Response) {
  const locationId =
    (req.body.locationId as string | undefined) ?? req.locationId ?? null;
  const entries = req.body.settings as Record<string, string>;

  await Promise.all(
    Object.entries(entries).map(async ([key, value]) => {
      const existing = await prisma.setting.findFirst({
        where: { key, locationId },
      });
      if (existing) {
        await prisma.setting.update({
          where: { id: existing.id },
          data: { value },
        });
      } else {
        await prisma.setting.create({
          data: { locationId, key, value },
        });
      }
    })
  );

  res.json({ success: true, data: { updated: Object.keys(entries).length } });
}