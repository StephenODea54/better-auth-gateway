import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { APIError } from "better-auth/api";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { auth } from "@/features/auth/clients/server-client.ts";

import { listMembersQueryOptions } from "./list-members.ts";

export const updateMemberRolesInputSchema = z.object({
  memberId: z.string().min(1),
  name: z.string().min(1),
  organizationId: z.string().min(1),
  roles: z.array(z.string().min(1)).min(1, "Pick at least one role."),
});

export type UpdateMemberRolesInput = z.infer<typeof updateMemberRolesInputSchema>;

export const updateMemberRoles = createServerFn({ method: "POST" })
  .validator(updateMemberRolesInputSchema)
  .handler(async ({ data }) => {
    try {
      await auth.api.updateMemberRole({
        body: {
          memberId: data.memberId,
          organizationId: data.organizationId,
          role: data.roles,
        },
        headers: getRequest().headers,
      });
    }
    catch (error) {
      console.error(error);

      if (error instanceof APIError) {
        throw new Error(error.message);
      }

      throw new Error("Could not change this member's roles.");
    }

    return { name: data.name, roles: data.roles };
  });

interface UseUpdateMemberRolesOptions {
  mutationConfig?: MutationConfig<typeof updateMemberRoles>;
  organizationId: string;
}

export function useUpdateMemberRoles({ mutationConfig, organizationId }: UseUpdateMemberRolesOptions) {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(organizationId).queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateMemberRoles,
  });
}
