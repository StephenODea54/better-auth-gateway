import process from "node:process";

interface PostgresConfig extends PostgresConnection {
  sslMode?: PostgresSslMode;
}

interface PostgresConnection {
  database: string;
  host: string;
  password: string;
  port: number | string;
  user: string;
}

type PostgresSslMode = "disable" | "require" | "verify-full";

export function buildPostgresConfig({ sslMode, ...connection }: PostgresConfig) {
  return {
    connectionString: buildPostgresUrl(connection),
    ...buildSsl(sslMode),
  };
}

export function buildPostgresUrl({
  database,
  host,
  password,
  port,
  user,
}: PostgresConnection): string {
  const credentials = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;

  return `postgresql://${credentials}@${host}:${port}/${encodeURIComponent(database)}`;
}

export function postgresConfigFromEnv() {
  return buildPostgresConfig({
    database: required("POSTGRES_DB"),
    host: required("POSTGRES_HOST"),
    password: required("POSTGRES_PASSWORD"),
    port: required("POSTGRES_PORT"),
    sslMode: process.env.POSTGRES_SSLMODE as PostgresSslMode | undefined,
    user: required("POSTGRES_USER"),
  });
}

export function postgresUrlFromEnv(): string {
  return buildPostgresUrl({
    database: required("POSTGRES_DB"),
    host: required("POSTGRES_HOST"),
    password: required("POSTGRES_PASSWORD"),
    port: required("POSTGRES_PORT"),
    user: required("POSTGRES_USER"),
  });
}

function buildSsl(sslMode: PostgresSslMode | undefined) {
  if (sslMode === undefined || sslMode === "disable") {
    return {};
  }

  return sslMode === "require" ? { ssl: { rejectUnauthorized: false } } : { ssl: true };
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}
