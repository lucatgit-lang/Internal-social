import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import type { IncomingMessage, ServerResponse } from "node:http";
import { env } from "./config/env.js";
import { authPlugin } from "./plugins/auth.js";
import { ApiError } from "./lib/errors.js";
import { bootstrapDatabase } from "./lib/bootstrap.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { communityRoutes } from "./routes/community.js";
import { chatRoutes } from "./routes/chat.js";

export function buildApp() {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
    // Supporta payload base64 piu' grandi per upload media inline (immagini/video).
    bodyLimit: 30 * 1024 * 1024
  });
  app.register(sensible);
  app.register(cors, { origin: env.CORS_ORIGIN.split(",").map((x) => x.trim()) });
  app.register(helmet);
  app.register(rateLimit, { max: env.NODE_ENV === "development" ? 2000 : 250, timeWindow: "1 minute" });
  app.register(authPlugin);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({ code: error.code, message: error.message, details: error.details, traceId: request.id });
    }
    const statusCode = typeof (error as any)?.statusCode === "number" ? (error as any).statusCode : 500;
    const message = error instanceof Error ? error.message : "Bad request";
    if (statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({ code: (error as any)?.code ?? "BAD_REQUEST", message, traceId: request.id });
    }
    request.log.error({ err: error }, "unhandled error");
    return reply.code(500).send({ code: "INTERNAL_SERVER_ERROR", message: "Errore interno", traceId: request.id });
  });

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(communityRoutes);
  app.register(chatRoutes);
  return app;
}

const vercelApp = buildApp();
let readyPromise: Promise<unknown> | null = null;

async function getVercelApp() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await bootstrapDatabase();
      await vercelApp.ready();
    })();
  }
  await readyPromise;
  return vercelApp;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getVercelApp();
  app.server.emit("request", req, res);
}
