import process from "node:process";

interface PostgresConnection {
  database: string;
  host: string;
  password: string;
  port: number | string;
  user: string;
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

export function postgresUrlFromEnv(): string {
  return buildPostgresUrl({
    database: required("POSTGRES_DB"),
    host: required("POSTGRES_HOST"),
    password: required("POSTGRES_PASSWORD"),
    port: required("POSTGRES_PORT"),
    user: required("POSTGRES_USER"),
  });
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}
