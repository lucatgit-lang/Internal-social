import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { bootstrapDatabase } from "./lib/bootstrap.js";

async function main() {
  const app = buildApp();
  try {
    await bootstrapDatabase();
    await app.listen({ host: "0.0.0.0", port: env.PORT });
    app.log.info(`HI Deddy Community backend running on ${env.PORT}`);
  } catch (error) {
    app.log.error({ err: error }, "startup failed");
    process.exit(1);
  }
}

void main();
