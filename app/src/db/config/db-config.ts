import { defineConfig } from "drizzle-kit";

import { postgresUrlFromEnv } from "../../config/postgres-url.ts";

export default defineConfig({
  dbCredentials: { url: postgresUrlFromEnv() },
  dialect: "postgresql",
  out: "./src/db/migrations",
  schema: "./src/db/schema/*-schema.ts",
});
