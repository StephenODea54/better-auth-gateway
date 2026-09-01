import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { auth } from "@/features/auth/clients/server-client.ts";
import { toFriendlyError } from "@/lib/errors.ts";
import { setEvent } from "@/lib/wide-event.ts";

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
      throw toFriendlyError(error, "Could not remove this member.");
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
