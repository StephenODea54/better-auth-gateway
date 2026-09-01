import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: {
    ...(globalThis.process?.env ?? {}),
    ...import.meta.env,
  },
  server: {
    APP_NAME: z.string().min(1).default("Auth Gateway"),
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
    SSO_ATTRIBUTE_EMAIL: z.string().min(1).optional(),
    SSO_ATTRIBUTE_FIRST_NAME: z.string().min(1).optional(),
    SSO_ATTRIBUTE_LAST_NAME: z.string().min(1).optional(),
    SSO_ATTRIBUTE_NAME: z.string().min(1).optional(),
    SSO_EMAIL_DOMAIN: z.string().min(1),
    SSO_IDP_CERT: z.base64().transform(atob),
    SSO_IDP_ENTITY_ID: z.string().min(1),
    SSO_IDP_ENTRY_POINT: z.url(),
    SSO_PROVIDER_ID: z.string().min(1).default("gateway"),
    SSO_PROVIDER_NAME: z.string().min(1).default("SSO"),
    TOKEN_LIFETIME: z
      .string()
      .regex(
        /^\d+\s*(?:[smhdw]|sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days|week|weeks)$/,
        "Use a time span such as 15m, 1h or 7d.",
      )
      .default("15m"),
  },
});
