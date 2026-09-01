import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { PermissionMap } from "@/features/access/lib/permissions.ts";
import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { organizationRole } from "@/db/schema/index.ts";
import { parsePermission } from "@/features/access/lib/permissions.ts";
import { roles } from "@/features/auth/lib/access-control.ts";
import { requireOrgPermission } from "@/features/auth/lib/guards.ts";

export const listRoles = createServerFn()
  .validator(z.object({ organizationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireOrgPermission(
      data.organizationId,
      { ac: ["read"] },
      "You do not have permission to view this application's roles.",
    );

    const rows = await db
      .select({ permission: organizationRole.permission, role: organizationRole.role })
      .from(organizationRole)
      .where(eq(organizationRole.organizationId, data.organizationId));

    const stored = new Map(rows.map(row => [row.role, parsePermission(row.permission)]));

    const builtIn = (["owner", "admin", "member"] as const).map((name) => {
      const permission: PermissionMap = {};

      for (const [key, actions] of Object.entries(roles[name].statements)) {
        permission[key] = [...actions].sort();
      }

      for (const [key, actions] of Object.entries(stored.get(name) ?? {})) {
        permission[key] = [...new Set([...(permission[key] ?? []), ...actions])].sort();
      }

      return { builtIn: true, name, permission };
    });

    const custom = rows
      .filter(row => !(row.role in roles))
      .map(row => ({
        builtIn: false,
        name: row.role,
        permission: stored.get(row.role) ?? {},
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...builtIn, ...custom];
  });

export type Role = ApiFnReturnType<typeof listRoles>[number];

interface UseRolesOptions {
  organizationId: string;
  queryConfig?: QueryConfig<typeof listRolesQueryOptions>;
}

export function listRolesQueryOptions(organizationId: string) {
  return queryOptions({
    enabled: organizationId.length > 0,
    queryFn: () => listRoles({ data: { organizationId } }),
    queryKey: ["roles", organizationId],
  });
}

export function useRoles({ organizationId, queryConfig }: UseRolesOptions) {
  return useQuery({
    ...listRolesQueryOptions(organizationId),
    ...queryConfig,
  });
}
