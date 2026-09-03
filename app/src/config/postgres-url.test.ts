import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPostgresUrl, postgresUrlFromEnv } from "./postgres-url.ts";

describe("buildPostgresUrl", () => {
  it("builds a connection url", () => {
    expect(buildPostgresUrl({
      database: "gateway",
      host: "localhost",
      password: "secret",
      port: 5432,
      user: "postgres",
    })).toBe("postgresql://postgres:secret@localhost:5432/gateway");
  });

  it("url-encodes user, password and database", () => {
    expect(buildPostgresUrl({
      database: "my db",
      host: "db.internal",
      password: "p@ss:word/1",
      port: "6543",
      user: "user@corp",
    })).toBe("postgresql://user%40corp:p%40ss%3Aword%2F1@db.internal:6543/my%20db");
  });
});

describe("postgresUrlFromEnv", () => {
  const variables = {
    POSTGRES_DB: "gateway",
    POSTGRES_HOST: "db.internal",
    POSTGRES_PASSWORD: "s3cret",
    POSTGRES_PORT: "5432",
    POSTGRES_USER: "gateway",
  };

  function stubAll(overrides: Partial<typeof variables> = {}) {
    for (const [name, value] of Object.entries({ ...variables, ...overrides })) {
      vi.stubEnv(name, value);
    }
  }

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the url from the POSTGRES_* variables", () => {
    stubAll();

    expect(postgresUrlFromEnv()).toBe("postgresql://gateway:s3cret@db.internal:5432/gateway");
  });

  it("names the missing variable", () => {
    stubAll({ POSTGRES_PASSWORD: "" });

    expect(() => postgresUrlFromEnv()).toThrow("Missing POSTGRES_PASSWORD");
  });
});
