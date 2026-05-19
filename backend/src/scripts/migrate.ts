import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "../lib/db.js";

async function ensureTable() {
  await db.query(`create schema if not exists app; create table if not exists app.schema_migrations (id text primary key, checksum text not null, executed_at timestamptz not null default now())`);
}

async function run() {
  await ensureTable();
  const dir = path.resolve(process.cwd(), "migrations");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(dir, file), "utf8");
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");
    const existing = await db.query<{ checksum: string }>("select checksum from app.schema_migrations where id=$1", [file]);
    if (existing.rowCount && existing.rows[0]?.checksum === checksum) continue;
    if (existing.rowCount) throw new Error(`Checksum mismatch ${file}`);
    const client = await db.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into app.schema_migrations (id, checksum) values ($1,$2)", [file, checksum]);
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }
  await db.end();
}

run().catch(async (e) => { console.error(e); await db.end(); process.exit(1); });
