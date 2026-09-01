import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    env: {
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      POSTGRES_DB: "test",
      POSTGRES_HOST: "localhost",
      POSTGRES_PASSWORD: "test",
      POSTGRES_PORT: "5432",
      POSTGRES_USER: "test",
      SSO_EMAIL_DOMAIN: "example.com",
      SSO_IDP_CERT: "dGVzdA==",
      SSO_IDP_ENTITY_ID: "test",
      SSO_IDP_ENTRY_POINT: "http://localhost:4000/saml",
    },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
