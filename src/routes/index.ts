import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, requireRoles, resolveLocation } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerAdminSchema } from "../schemas/auth.schema.js";
import { memberCreateSchema } from "../schemas/member.schema.js";
import * as auth from "../controllers/auth.controller.js";
import * as dashboard from "../controllers/dashboard.controller.js";
import * as members from "../controllers/members.controller.js";
import * as visitors from "../controllers/visitors.controller.js";
import * as plans from "../controllers/plans.controller.js";
import * as payments from "../controllers/payments.controller.js";
import * as attendance from "../controllers/attendance.controller.js";
import * as trainers from "../controllers/trainers.controller.js";
import * as schedule from "../controllers/schedule.controller.js";
import * as equipment from "../controllers/equipment.controller.js";
import * as reports from "../controllers/reports.controller.js";
import * as settings from "../controllers/settings.controller.js";
import * as locations from "../controllers/locations.controller.js";
import * as search from "../controllers/search.controller.js";
import * as notifications from "../controllers/notifications.controller.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", service: "gympro-api" } });
});

apiRouter.post("/auth/login", validateBody(loginSchema), asyncHandler(auth.login));
apiRouter.post(
  "/auth/bootstrap",
  validateBody(registerAdminSchema),
  asyncHandler(auth.bootstrapAdmin)
);
apiRouter.get("/auth/me", authenticate, asyncHandler(auth.getMe));

const protectedRouter = Router();
protectedRouter.use(authenticate, resolveLocation);

protectedRouter.get("/dashboard/overview", asyncHandler(dashboard.getDashboardOverview));

protectedRouter.get("/locations", asyncHandler(locations.listLocations));
protectedRouter.post(
  "/locations",
  requireRoles("ADMIN", "GENERAL_MANAGER"),
  asyncHandler(locations.createLocation)
);

protectedRouter.get("/search", asyncHandler(search.globalSearch));

protectedRouter.get("/members", asyncHandler(members.listMembers));
protectedRouter.get("/members/:id", asyncHandler(members.getMember));
protectedRouter.post(
  "/members",
  validateBody(memberCreateSchema),
  asyncHandler(members.createMember)
);
protectedRouter.patch("/members/:id", asyncHandler(members.updateMember));
protectedRouter.delete(
  "/members/:id",
  requireRoles("ADMIN", "GENERAL_MANAGER"),
  asyncHandler(members.deleteMember)
);

protectedRouter.get("/visitors", asyncHandler(visitors.listVisitors));
protectedRouter.post("/visitors", asyncHandler(visitors.createVisitor));
protectedRouter.post("/visitors/:id/convert", asyncHandler(visitors.convertVisitor));

protectedRouter.get("/membership-plans", asyncHandler(plans.listPlans));
protectedRouter.post(
  "/membership-plans",
  requireRoles("ADMIN", "GENERAL_MANAGER"),
  asyncHandler(plans.createPlan)
);
protectedRouter.patch(
  "/membership-plans/:id",
  requireRoles("ADMIN", "GENERAL_MANAGER"),
  asyncHandler(plans.updatePlan)
);
protectedRouter.delete(
  "/membership-plans/:id",
  requireRoles("ADMIN", "GENERAL_MANAGER"),
  asyncHandler(plans.deletePlan)
);

protectedRouter.get("/payments", asyncHandler(payments.listPayments));
protectedRouter.get("/payments/summary", asyncHandler(payments.billingSummary));
protectedRouter.post("/payments", asyncHandler(payments.createPayment));

protectedRouter.get("/attendance", asyncHandler(attendance.listAttendance));
protectedRouter.get("/attendance/live", asyncHandler(attendance.attendanceLive));
protectedRouter.post("/attendance/check-in", asyncHandler(attendance.checkIn));
protectedRouter.post("/attendance/check-out", asyncHandler(attendance.checkOut));

protectedRouter.get("/trainers", asyncHandler(trainers.listTrainers));
protectedRouter.post("/trainers", asyncHandler(trainers.createTrainer));
protectedRouter.patch("/trainers/:id", asyncHandler(trainers.updateTrainer));
protectedRouter.delete("/trainers/:id", asyncHandler(trainers.deleteTrainer));

protectedRouter.get("/schedule/classes", asyncHandler(schedule.listClasses));
protectedRouter.post("/schedule/classes", asyncHandler(schedule.createClass));
protectedRouter.post("/schedule/classes/:id/book", asyncHandler(schedule.bookClass));
protectedRouter.patch(
  "/schedule/classes/:id/status",
  asyncHandler(schedule.updateClassStatus)
);

protectedRouter.get("/equipment", asyncHandler(equipment.listEquipment));
protectedRouter.post("/equipment", asyncHandler(equipment.createEquipment));
protectedRouter.patch("/equipment/:id", asyncHandler(equipment.updateEquipment));
protectedRouter.delete("/equipment/:id", asyncHandler(equipment.deleteEquipment));

protectedRouter.get("/reports/members", asyncHandler(reports.membersReport));
protectedRouter.get("/reports/revenue", asyncHandler(reports.revenueReport));
protectedRouter.get("/reports/attendance", asyncHandler(reports.attendanceReport));

protectedRouter.get("/settings", asyncHandler(settings.listSettings));
protectedRouter.put(
  "/settings",
  requireRoles("ADMIN", "GENERAL_MANAGER"),
  asyncHandler(settings.upsertSettings)
);

protectedRouter.get("/notifications", asyncHandler(notifications.listNotifications));
protectedRouter.patch(
  "/notifications/:id/read",
  asyncHandler(notifications.markNotificationRead)
);

apiRouter.use(protectedRouter);