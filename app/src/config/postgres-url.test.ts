import { describe, expect, it } from "vitest";

import { buildPostgresUrl } from "./postgres-url.ts";

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
