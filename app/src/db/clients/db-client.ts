import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/config/env.ts";
import { buildPostgresConfig } from "@/config/postgres-url.ts";
import { countEvent } from "@/lib/wide-event.ts";

import * as schema from "../schema/index.ts";

export const db = drizzle({
  connection: buildPostgresConfig({
    database: env.POSTGRES_DB,
    host: env.POSTGRES_HOST,
    password: env.POSTGRES_PASSWORD,
    port: env.POSTGRES_PORT,
    sslMode: env.POSTGRES_SSLMODE,
    user: env.POSTGRES_USER,
  }),
  logger: { logQuery: () => countEvent("db.query_count") },
  schema: { ...schema },
});
