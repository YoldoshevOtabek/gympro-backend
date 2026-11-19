
import { execSync } from "node:child_process";
import { env } from "../config/env.js";

function assertProductionDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? "";

  if (env.nodeEnv !== "production") return;

  if (
    !url.startsWith("postgresql://") &&
    !url.startsWith("postgres://")
  ) {
    throw new Error(
      "DATABASE_URL must be a valid PostgreSQL connection string. " +
        "Configure Neon or Render PostgreSQL in environment variables."
    );
  }
}

export async function prepareDatabase() {
  assertProductionDatabaseUrl();

  if (env.nodeEnv !== "production") {
    console.log("[db] Development mode. Skipping automatic schema push.");
    return;
  }

  console.log("[db] Applying Prisma schema...");

  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: process.env,
  });

  if (process.env.SEED_DATABASE === "true") {
    console.log("[db] Running database seed...");

    execSync("npx prisma db seed", {
      stdio: "inherit",
      env: process.env,
    });
  }

  console.log("[db] Database preparation completed.");
}
