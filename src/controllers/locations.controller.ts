import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listLocations(_req: Request, res: Response) {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json({ success: true, data: locations });
}

export async function createLocation(req: Request, res: Response) {
  const body = req.body as {
    name: string;
    slug: string;
    address?: string;
    capacity?: number;
    timezone?: string;
  };

  const location = await prisma.location.create({ data: body });
  res.status(201).json({ success: true, data: location });
}