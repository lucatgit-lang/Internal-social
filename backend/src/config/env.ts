import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

for (const p of [path.resolve(process.cwd(), ".env"), path.resolve(process.cwd(), "backend", ".env")]) {
  if (fs.existsSync(p)) dotenv.config({ path: p, override: false });
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4010),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  CORS_ORIGIN: z.string().default("http://localhost:5180")
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
export const env = parsed.data;
