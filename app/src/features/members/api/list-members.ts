import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { APIError } from "better-auth/api";
import { z } from "zod";

import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { auth } from "@/features/auth/clients/server-client.ts";

export const listMembers = createServerFn()
  .validator(z.object({ organizationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const { members } = await auth.api.listMembers({
        headers: getRequest().headers,
        query: { organizationId: data.organizationId },
      });

      return members
        .map(member => ({
          createdAt: member.createdAt,
          email: member.user.email,
          id: member.id,
          image: member.user.image ?? null,
          name: member.user.name,
          roles: member.role
            .split(",")
            .map(role => role.trim())
            .filter(Boolean)
            .sort(),
          userId: member.userId,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    catch (error) {
      console.error(error);

      if (error instanceof APIError) {
        throw new Error(error.message);
      }

      throw new Error("Could not load this application's members.");
    }
  });

export type Member = ApiFnReturnType<typeof listMembers>[number];

interface UseMembersOptions {
  organizationId: string;
  queryConfig?: QueryConfig<typeof listMembersQueryOptions>;
}

export function listMembersQueryOptions(organizationId: string) {
  return queryOptions({
    enabled: organizationId.length > 0,
    queryFn: () => listMembers({ data: { organizationId } }),
    queryKey: ["members", organizationId],
  });
}

export function useMembers({ organizationId, queryConfig }: UseMembersOptions) {
  return useQuery({
    ...listMembersQueryOptions(organizationId),
    ...queryConfig,
  });
}
