import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { postgresUrlFromEnv } from "../config/postgres-url.ts";

const MIGRATION_LOCK_KEY = 7_364_512_803;

const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

function log(fields: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify({ "event.name": "db.migrate", "timestamp": new Date().toISOString(), ...fields })}\n`);
}

async function main() {
  const startedAt = performance.now();

  try {
    await runMigrations();
    log({ duration_ms: Math.round(performance.now() - startedAt), outcome: "ok" });
  }
  catch (error) {
    log({
      "duration_ms": Math.round(performance.now() - startedAt),
      "error.message": error instanceof Error ? error.message : String(error),
      "outcome": "error",
    });
    process.exitCode = 1;
  }
}

async function runMigrations() {
  const client = new pg.Client({ connectionString: postgresUrlFromEnv() });
  await client.connect();

  try {
    await client.query("select pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    await migrate(drizzle(client), { migrationsFolder });
  }
  finally {
    await client.end();
  }
}

void main();
