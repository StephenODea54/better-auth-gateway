import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
  },
  clientPrefix: "VITE_",
  emptyStringAsUndefined: true,
  runtimeEnv: {
    ...(globalThis.process?.env ?? {}),
    ...import.meta.env,
  },
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    POSTGRES_DB: z.string().min(1),
    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_PORT: z.coerce.number().int().positive(),
    POSTGRES_USER: z.string().min(1),
    SSO_EMAIL_DOMAIN: z.string().min(1),
    SSO_IDP_CERT: z.base64().transform(atob),
    SSO_IDP_ENTITY_ID: z.string().min(1),
    SSO_IDP_ENTRY_POINT: z.url(),
  },
});
