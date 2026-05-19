import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; email: string; roles: string[]; typ: "access" | "refresh" };
    user: { sub: string; email: string; roles: string[]; typ: "access" | "refresh" };
  }
}
