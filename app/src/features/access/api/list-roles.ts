import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { organizationRole } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { roles } from "@/features/auth/lib/access-control.ts";

export const listRoles = createServerFn()
  .validator(z.object({ organizationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { ac: ["read"] },
      },
      headers: getRequest().headers,
    });

    if (!success) {
      throw new Error("You do not have permission to view this application's roles.");
    }

    const rows = await db
      .select({ permission: organizationRole.permission, role: organizationRole.role })
      .from(organizationRole)
      .where(eq(organizationRole.organizationId, data.organizationId));

    const stored = new Map(rows.map(row => [
      row.role,
      JSON.parse(row.permission) as Record<string, string[]>,
    ]));

    const builtIn = (["owner", "admin", "member"] as const).map((name) => {
      const permission: Record<string, string[]> = {};

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
