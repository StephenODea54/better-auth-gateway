import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/config/env.ts";

import * as schema from "../schema.ts";
import * as authSchema from "../schema/auth-schema.ts";

export const db = drizzle(env.DATABASE_URL, {
  schema: { ...schema, ...authSchema },
});
