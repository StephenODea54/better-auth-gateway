import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { requireSuperAdmin } from "@/features/auth/lib/guards.ts";
import { listSuperAdminAccounts } from "@/features/auth/lib/super-admin.ts";

export const listSuperAdmins = createServerFn().handler(async () => {
  await requireSuperAdmin("Only gateway super admins can see who administers the gateway.");

  const accounts = await listSuperAdminAccounts();

  return accounts.sort((a, b) => a.name.localeCompare(b.name));
});

export type SuperAdmin = ApiFnReturnType<typeof listSuperAdmins>[number];

interface UseSuperAdminsOptions {
  queryConfig?: QueryConfig<typeof listSuperAdminsQueryOptions>;
}

export function listSuperAdminsQueryOptions() {
  return queryOptions({
    queryFn: () => listSuperAdmins(),
    queryKey: ["super-admins"],
  });
}

export function useSuperAdmins({ queryConfig }: UseSuperAdminsOptions = {}) {
  return useQuery({
    ...listSuperAdminsQueryOptions(),
    ...queryConfig,
  });
}
