import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { mountSwagger } from "./swagger/setup.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  mountSwagger(app);

  app.use("/api/v1", apiRouter);

  app.use(errorHandler);

  return app;
}