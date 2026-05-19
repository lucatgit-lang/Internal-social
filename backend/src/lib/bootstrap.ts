import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { hashPassword } from "./password.js";

const ADMIN_EMAIL = "admin@hideddy.community";
const ADMIN_PASSWORD = "ChangeMe123!";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function bootstrapDatabase(): Promise<void> {
  await db.query(`
    create extension if not exists pgcrypto;
    create schema if not exists app;
    create table if not exists app.schema_migrations (
      id text primary key,
      checksum text not null,
      executed_at timestamptz not null default now()
    );
  `);

  const baseDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.resolve(baseDir, "../../migrations");
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const checksum = sha256(sql);
    const existing = await db.query<{ checksum: string }>("select checksum from app.schema_migrations where id = $1", [file]);
    if (existing.rowCount && existing.rows[0]?.checksum === checksum) {
      continue;
    }
    if (existing.rowCount) {
      throw new Error(`Migration checksum mismatch for ${file}`);
    }

    const client = await db.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into app.schema_migrations (id, checksum) values ($1, $2)", [file, checksum]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  const existingAdmin = await db.query<{ id: string }>(
    "select id::text from app.users where lower(email) = lower($1) limit 1",
    [ADMIN_EMAIL]
  );

  if (!existingAdmin.rowCount) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await db.query(
      `insert into app.users (email, password_hash, full_name, role, title, is_active)
       values ($1, $2, $3, 'admin', $4, true)`,
      [ADMIN_EMAIL, passwordHash, "Deddy Admin", "Amministratore"]
    );
  }
}
