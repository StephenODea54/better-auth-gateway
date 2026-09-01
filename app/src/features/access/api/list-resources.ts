import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { organizationRole } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";

export const listResources = createServerFn()
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
      throw new Error("You do not have permission to view this application's resources.");
    }

    const [catalogRole] = await db
      .select({ permission: organizationRole.permission })
      .from(organizationRole)
      .where(and(
        eq(organizationRole.organizationId, data.organizationId),
        eq(organizationRole.role, "owner"),
      ))
      .limit(1);

    const catalog = catalogRole
      ? JSON.parse(catalogRole.permission) as Record<string, string[]>
      : {};

    return Object.entries(catalog)
      .map(([key, actions]) => ({ actions: [...actions].sort(), key }))
      .sort((a, b) => a.key.localeCompare(b.key));
  });

export type Resource = ApiFnReturnType<typeof listResources>[number];

interface UseResourcesOptions {
  organizationId: string;
  queryConfig?: QueryConfig<typeof listResourcesQueryOptions>;
}

export function listResourcesQueryOptions(organizationId: string) {
  return queryOptions({
    enabled: organizationId.length > 0,
    queryFn: () => listResources({ data: { organizationId } }),
    queryKey: ["resources", organizationId],
  });
}

export function useResources({ organizationId, queryConfig }: UseResourcesOptions) {
  return useQuery({
    ...listResourcesQueryOptions(organizationId),
    ...queryConfig,
  });
}
