import { defineConfig } from "drizzle-kit";
import process from "node:process";

import { buildPostgresUrl } from "../../config/postgres-url.ts";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

export default defineConfig({
  dbCredentials: {
    url: buildPostgresUrl({
      database: required("POSTGRES_DB"),
      host: required("POSTGRES_HOST"),
      password: required("POSTGRES_PASSWORD"),
      port: required("POSTGRES_PORT"),
      user: required("POSTGRES_USER"),
    }),
  },
  dialect: "postgresql",
  out: "./src/db/migrations",
  schema: "./src/db/schema/*-schema.ts",
});
