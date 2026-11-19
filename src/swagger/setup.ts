import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";

const swaggerOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: "GymPro API Docs",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};

export function mountSwagger(app: Express) {
  app.get("/api/docs/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, swaggerOptions)
  );
}