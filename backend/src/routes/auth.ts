import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ApiError } from "../lib/errors.js";
import { verifyPassword } from "../lib/password.js";
import crypto from "node:crypto";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

function sha256(v: string) { return crypto.createHash("sha256").update(v).digest("hex"); }

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid login payload", parsed.error.flatten());
    const { email, password } = parsed.data;
    const r = await db.query<{ id: string; email: string; password_hash: string; role: string; full_name: string; title: string | null }>(
      "select id::text,email,password_hash,role,full_name,title from app.users where lower(email)=lower($1) and is_active=true limit 1", [email]
    );
    const u = r.rows[0];
    if (!u || !(await verifyPassword(password, u.password_hash))) throw new ApiError(401, "INVALID_CREDENTIALS", "Email o password non validi");

    const payload = { sub: u.id, email: u.email, roles: [u.role], typ: "access" as const };
    const accessToken = await reply.jwtSign(payload);
    const refreshToken = await reply.jwtSign({ ...payload, typ: "refresh" as const }, { expiresIn: "7d" });

    await db.query("insert into app.sessions (user_id, refresh_token_hash, expires_at) values ($1::uuid,$2, now()+ interval '7 day')", [u.id, sha256(refreshToken)]);

    return { accessToken, refreshToken, expiresIn: 900, user: { id: u.id, email: u.email, name: u.full_name, title: u.title, roles: [u.role] } };
  });

  app.post("/api/v1/auth/refresh", async (request, reply) => {
    const body = request.body as { refreshToken?: string } | undefined;
    const token = body?.refreshToken;
    if (!token) throw new ApiError(400, "VALIDATION_ERROR", "refreshToken is required");
    let decoded: { sub: string; email: string; roles: string[]; typ: string };
    try { decoded = app.jwt.verify(token) as any; } catch { throw new ApiError(401, "INVALID_TOKEN", "Refresh token non valido"); }
    if (decoded.typ !== "refresh") throw new ApiError(401, "INVALID_TOKEN_TYPE", "Refresh token non valido");

    const hash = sha256(token);
    const found = await db.query<{ id: string }>("select id::text from app.sessions where user_id=$1::uuid and refresh_token_hash=$2 and revoked_at is null and expires_at > now() limit 1", [decoded.sub, hash]);
    if (!found.rows[0]) throw new ApiError(401, "INVALID_TOKEN", "Refresh token non valido");

    const payload = { sub: decoded.sub, email: decoded.email, roles: decoded.roles, typ: "access" as const };
    const accessToken = await reply.jwtSign(payload);
    const refreshToken = await reply.jwtSign({ ...payload, typ: "refresh" as const }, { expiresIn: "7d" });

    await db.query("update app.sessions set revoked_at = now() where id::text=$1", [found.rows[0].id]);
    await db.query("insert into app.sessions (user_id, refresh_token_hash, expires_at) values ($1::uuid,$2, now()+ interval '7 day')", [decoded.sub, sha256(refreshToken)]);

    return { accessToken, refreshToken, expiresIn: 900 };
  });

  app.get("/api/v1/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    const me = await db.query<{ id: string; email: string; role: string; full_name: string; title: string | null }>(
      "select id::text,email,role,full_name,title from app.users where id=$1::uuid limit 1", [request.user.sub]
    );
    if (!me.rows[0]) throw new ApiError(404, "NOT_FOUND", "User not found");
    return { user: { id: me.rows[0].id, email: me.rows[0].email, name: me.rows[0].full_name, title: me.rows[0].title, roles: [me.rows[0].role] } };
  });

  app.post("/api/v1/auth/logout", { preHandler: [app.authenticate] }, async (request) => {
    await db.query("update app.sessions set revoked_at=now() where user_id=$1::uuid and revoked_at is null", [request.user.sub]);
    return { success: true };
  });
}
