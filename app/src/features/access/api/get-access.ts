import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { auth } from "@/features/auth/clients/server-client.ts";

export const getAccess = createServerFn()
  .validator(z.object({ organizationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const headers = getRequest().headers;

    const [create, remove, update] = await Promise.all(
      (["create", "delete", "update"] as const).map(action =>
        auth.api.hasPermission({
          body: {
            organizationId: data.organizationId,
            permissions: { ac: [action] },
          },
          headers,
        }),
      ),
    );

    return {
      canCreate: create.success,
      canDelete: remove.success,
      canUpdate: update.success,
    };
  });

export type Access = ApiFnReturnType<typeof getAccess>;

interface UseAccessOptions {
  organizationId: string;
  queryConfig?: QueryConfig<typeof getAccessQueryOptions>;
}

export function getAccessQueryOptions(organizationId: string) {
  return queryOptions({
    enabled: organizationId.length > 0,
    queryFn: () => getAccess({ data: { organizationId } }),
    queryKey: ["access", organizationId],
  });
}

export function useAccess({ organizationId, queryConfig }: UseAccessOptions) {
  return useQuery({
    ...getAccessQueryOptions(organizationId),
    ...queryConfig,
  });
}
