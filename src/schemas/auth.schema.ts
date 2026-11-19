import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(["ADMIN", "GENERAL_MANAGER", "STAFF", "TRAINER"]).optional(),
  locationId: z.string().optional(),
});