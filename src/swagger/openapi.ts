export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "GymPro Admin API",
    version: "1.0.0",
    description:
      "REST API for the GymPro admin panel: members, billing, attendance, schedule, and dashboard analytics.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Dashboard" },
    { name: "Locations" },
    { name: "Search" },
    { name: "Members" },
    { name: "Visitors" },
    { name: "Membership Plans" },
    { name: "Payments" },
    { name: "Attendance" },
    { name: "Trainers" },
    { name: "Schedule" },
    { name: "Equipment" },
    { name: "Reports" },
    { name: "Settings" },
    { name: "Notifications" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    parameters: {
      LocationHeader: {
        name: "X-Location-Id",
        in: "header",
        description: "Active club/location for multi-site gyms",
        schema: { type: "string" },
      },
      Page: {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1 },
      },
      Limit: {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 20, maximum: 100 },
      },
    },
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          meta: { type: "object" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": { description: "Service is up" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "accessToken, refreshToken (7d), user",
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate refresh token and get new access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "New token pair" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Revoke refresh token",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/auth/bootstrap": {
      post: {
        tags: ["Auth"],
        summary: "Create first admin (development only)",
        requestBody: { required: true, content: { "application/json": {} } },
        responses: { "201": { description: "Admin created" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profile" } },
      },
    },
    "/dashboard/overview": {
      get: {
        tags: ["Dashboard"],
        summary: "Dashboard KPIs and widgets",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/LocationHeader" }],
        responses: { "200": { description: "Overview payload" } },
      },
    },
    "/locations": {
      get: {
        tags: ["Locations"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "List locations" } },
      },
      post: {
        tags: ["Locations"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Location created" } },
      },
    },
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Global search (members, plans)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          { $ref: "#/components/parameters/LocationHeader" },
        ],
        responses: { "200": { description: "Search results" } },
      },
    },
    "/members": {
      get: {
        tags: ["Members"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Limit" },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "planId", in: "query", schema: { type: "string" } },
          { name: "locationId", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated members" } },
      },
      post: {
        tags: ["Members"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Member created" } },
      },
    },
    "/members/{id}": {
      get: {
        tags: ["Members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Member detail" } },
      },
      patch: {
        tags: ["Members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Member updated" } },
      },
      delete: {
        tags: ["Members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Member deleted" } },
      },
    },
    "/visitors": {
      get: {
        tags: ["Visitors"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/Page" }, { $ref: "#/components/parameters/Limit" }],
        responses: { "200": { description: "Leads list" } },
      },
      post: {
        tags: ["Visitors"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Lead created" } },
      },
    },
    "/visitors/{id}/convert": {
      post: {
        tags: ["Visitors"],
        summary: "Convert lead to member",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Member created from lead" } },
      },
    },
    "/membership-plans": {
      get: {
        tags: ["Membership Plans"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Plans list" } },
      },
      post: {
        tags: ["Membership Plans"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Plan created" } },
      },
    },
    "/membership-plans/{id}": {
      patch: {
        tags: ["Membership Plans"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Plan updated" } },
      },
      delete: {
        tags: ["Membership Plans"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Plan deleted" } },
      },
    },
    "/payments": {
      get: {
        tags: ["Payments"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/Page" }, { $ref: "#/components/parameters/Limit" }],
        responses: { "200": { description: "Payments list" } },
      },
      post: {
        tags: ["Payments"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Payment recorded" } },
      },
    },
    "/payments/summary": {
      get: {
        tags: ["Payments"],
        summary: "Billing summary for current month",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Billing summary" } },
      },
    },
    "/attendance": {
      get: {
        tags: ["Attendance"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/Page" }, { $ref: "#/components/parameters/Limit" }],
        responses: { "200": { description: "Attendance history" } },
      },
    },
    "/attendance/live": {
      get: {
        tags: ["Attendance"],
        summary: "Current check-ins / capacity",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Live occupancy" } },
      },
    },
    "/attendance/check-in": {
      post: {
        tags: ["Attendance"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Checked in" } },
      },
    },
    "/attendance/check-out": {
      post: {
        tags: ["Attendance"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Checked out" } },
      },
    },
    "/trainers": {
      get: {
        tags: ["Trainers"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Trainers list" } },
      },
      post: {
        tags: ["Trainers"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Trainer created" } },
      },
    },
    "/trainers/{id}": {
      patch: {
        tags: ["Trainers"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Trainer updated" } },
      },
      delete: {
        tags: ["Trainers"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Trainer deactivated" } },
      },
    },
    "/schedule/classes": {
      get: {
        tags: ["Schedule"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: { "200": { description: "Classes in range" } },
      },
      post: {
        tags: ["Schedule"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Class scheduled" } },
      },
    },
    "/schedule/classes/{id}/book": {
      post: {
        tags: ["Schedule"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Booking created" } },
      },
    },
    "/schedule/classes/{id}/status": {
      patch: {
        tags: ["Schedule"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Class status updated" } },
      },
    },
    "/equipment": {
      get: {
        tags: ["Equipment"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Equipment inventory" } },
      },
      post: {
        tags: ["Equipment"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Equipment added" } },
      },
    },
    "/equipment/{id}": {
      patch: {
        tags: ["Equipment"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Equipment updated" } },
      },
      delete: {
        tags: ["Equipment"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Equipment removed" } },
      },
    },
    "/reports/members": {
      get: {
        tags: ["Reports"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"] } }],
        responses: { "200": { description: "Members export" } },
      },
    },
    "/reports/revenue": {
      get: {
        tags: ["Reports"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "year", in: "query", schema: { type: "integer" } }],
        responses: { "200": { description: "Revenue by month" } },
      },
    },
    "/reports/attendance": {
      get: {
        tags: ["Reports"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: { "200": { description: "Attendance analytics" } },
      },
    },
    "/settings": {
      get: {
        tags: ["Settings"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Settings key-value map" } },
      },
      put: {
        tags: ["Settings"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Settings updated" } },
      },
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "unread", in: "query", schema: { type: "boolean" } }],
        responses: { "200": { description: "Notifications" } },
      },
    },
    "/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Marked as read" } },
      },
    },
  },
} as const;