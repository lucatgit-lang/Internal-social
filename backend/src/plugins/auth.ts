import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { env } from "../config/env.js";
import { ApiError } from "../lib/errors.js";

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, { secret: env.JWT_ACCESS_SECRET, sign: { expiresIn: "15m" } });
  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
      if (request.user?.typ !== "access") return reply.code(401).send({ code: "INVALID_TOKEN_TYPE", message: "Access token required" });
    } catch {
      return reply.code(401).send({ code: "UNAUTHORIZED", message: "Invalid token" });
    }
  });
  app.decorate("authorizeRoles", (required: string[]) => async (request: any) => {
    const roles = Array.isArray(request.user?.roles) ? request.user.roles : [];
    if (!required.some((r) => roles.includes(r))) throw new ApiError(403, "FORBIDDEN", "Permessi insufficienti");
  });
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    authorizeRoles: (requiredRoles: string[]) => (request: any, reply: any) => Promise<void>;
  }
}
