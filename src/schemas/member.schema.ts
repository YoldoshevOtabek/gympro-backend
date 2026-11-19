import { z } from "zod";

export const memberCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  rfidTag: z.string().optional(),
  planId: z.string(),
  locationId: z.string(),
  status: z
    .enum(["ACTIVE", "PAUSED", "GRACE", "INACTIVE", "EXPIRED"])
    .optional(),
  autoRenew: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const memberUpdateSchema = memberCreateSchema.partial().omit({
  email: true,
});

export const memberListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  planId: z.string().optional(),
  locationId: z.string().optional(),
});