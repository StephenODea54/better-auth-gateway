import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { member, organizationRole } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { roles } from "@/features/auth/lib/access-control.ts";
import { setEventError } from "@/lib/wide-event.ts";

import { listRolesQueryOptions } from "./list-roles.ts";

export const deleteRoleInputSchema = z.object({
  organizationId: z.string().min(1),
  role: z.string().min(1),
});

export const deleteRole = createServerFn({ method: "POST" })
  .validator(deleteRoleInputSchema)
  .handler(async ({ data }) => {
    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { ac: ["delete"] },
      },
      headers: getRequest().headers,
    });

    if (!success) {
      throw new Error("You do not have permission to change this application's roles.");
    }

    if (data.role in roles) {
      throw new Error("Built-in roles are defined in code and cannot be deleted.");
    }

    const members = await db
      .select({ role: member.role })
      .from(member)
      .where(eq(member.organizationId, data.organizationId));

    const holders = members.filter(row => row.role
      .split(",")
      .map(value => value.trim())
      .includes(data.role)).length;

    if (holders > 0) {
      throw new Error(
        `${holders} ${holders === 1 ? "member holds" : "members hold"} this role. Reassign them first.`,
      );
    }

    try {
      await db
        .delete(organizationRole)
        .where(and(
          eq(organizationRole.organizationId, data.organizationId),
          eq(organizationRole.role, data.role),
        ));
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not delete this role.");
    }

    return { role: data.role };
  });

interface UseDeleteRoleOptions {
  mutationConfig?: MutationConfig<typeof deleteRole>;
  organizationId: string;
}

export function useDeleteRole({ mutationConfig, organizationId }: UseDeleteRoleOptions) {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: listRolesQueryOptions(organizationId).queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteRole,
  });
}
