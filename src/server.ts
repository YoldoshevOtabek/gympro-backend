import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { prepareDatabase } from "./lib/prepareDatabase.js";

async function main() {
  await prepareDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`GymPro API listening on http://localhost:${env.port}/api/v1`);
    console.log(`Swagger: http://localhost:${env.port}/api/docs`);
  });

  async function shutdown() {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});