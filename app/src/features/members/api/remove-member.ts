import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { APIError } from "better-auth/api";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { auth } from "@/features/auth/clients/server-client.ts";
import { isSuperAdminMembership } from "@/features/auth/lib/super-admin.ts";
import { setEvent, setEventError } from "@/lib/wide-event.ts";

import { listMembersQueryOptions } from "./list-members.ts";

export const removeMemberInputSchema = z.object({
  memberId: z.string().min(1),
  name: z.string().min(1),
  organizationId: z.string().min(1),
});

export const removeMember = createServerFn({ method: "POST" })
  .validator(removeMemberInputSchema)
  .handler(async ({ data }) => {
    setEvent({ "event.kind": "member.removed", "organization.id": data.organizationId });

    if (await isSuperAdminMembership(data.memberId)) {
      throw new Error("This person is a gateway super admin. Their access is managed from the gateway, not from this application.");
    }

    try {
      await auth.api.removeMember({
        body: {
          memberIdOrEmail: data.memberId,
          organizationId: data.organizationId,
        },
        headers: getRequest().headers,
      });
    }
    catch (error) {
      setEventError(error);

      if (error instanceof APIError) {
        throw new Error(error.message);
      }

      throw new Error("Could not remove this member.");
    }

    return { name: data.name };
  });

interface UseRemoveMemberOptions {
  mutationConfig?: MutationConfig<typeof removeMember>;
  organizationId: string;
}

export function useRemoveMember({ mutationConfig, organizationId }: UseRemoveMemberOptions) {
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
    mutationFn: removeMember,
  });
}
