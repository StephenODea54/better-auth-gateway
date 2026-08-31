import { defineConfig } from "drizzle-kit";
import process from "node:process";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./src/db/migrations",
  schema: "./src/db/schema/*-schema.ts",
});
