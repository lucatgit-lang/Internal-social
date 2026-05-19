import type { FastifyInstance } from "fastify";
import { db } from "../lib/db.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/health", async () => {
    await db.query("select 1");
    return { status: "ok", service: "hi-deddy-community-backend", timestamp: new Date().toISOString() };
  });
}
