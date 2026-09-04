import { env } from "@/config/env.ts";
import { db } from "@/db/clients/db-client.ts";
import { organization } from "@/db/schema/index.ts";

export async function isTrustedOrigin(origin: string) {
  return (await trustedOrigins()).includes(origin);
}

export async function trustedOrigins() {
  const applications = await db.select({ origin: organization.origin }).from(organization);

  return [env.BETTER_AUTH_URL, ...applications.map(application => application.origin)];
}
