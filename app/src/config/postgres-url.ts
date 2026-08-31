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
