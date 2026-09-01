import { getRequest } from "@tanstack/react-start/server";

import { auth } from "@/features/auth/clients/server-client.ts";
import { isSuperAdmin } from "@/features/auth/lib/super-admin.ts";

export type MemberRole = NonNullable<Parameters<typeof auth.api.addMember>[0]>["body"]["role"];

export type UserRole = NonNullable<Parameters<typeof auth.api.setRole>[0]>["body"]["role"];

type PermissionCheck = NonNullable<Parameters<typeof auth.api.hasPermission>[0]>["body"]["permissions"];

export async function requireOrgPermission(
  organizationId: string,
  permissions: PermissionCheck,
  message: string,
) {
  const { success } = await auth.api.hasPermission({
    body: { organizationId, permissions },
    headers: getRequest().headers,
  });

  if (!success) {
    throw new Error(message);
  }
}

export async function requireSuperAdmin(message: string) {
  const session = await auth.api.getSession({ headers: getRequest().headers });

  if (!session || !isSuperAdmin(session.user.role)) {
    throw new Error(message);
  }

  return session;
}
