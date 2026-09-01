import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { organizationRole } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { setEventError } from "@/lib/wide-event.ts";

import { listResourcesQueryOptions } from "./list-resources.ts";

export const deleteResourceInputSchema = z.object({
  key: z.string().min(1),
  organizationId: z.string().min(1),
});

export const deleteResource = createServerFn({ method: "POST" })
  .validator(deleteResourceInputSchema)
  .handler(async ({ data }) => {
    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { ac: ["delete"] },
      },
      headers: getRequest().headers,
    });

    if (!success) {
      throw new Error("You do not have permission to change this application's resources.");
    }

    try {
      await db.transaction(async (tx) => {
        const [catalogRole] = await tx
          .select()
          .from(organizationRole)
          .where(and(
            eq(organizationRole.organizationId, data.organizationId),
            eq(organizationRole.role, "owner"),
          ))
          .limit(1);

        if (!catalogRole) {
          return;
        }

        const catalog = JSON.parse(catalogRole.permission) as Record<string, string[]>;

        delete catalog[data.key];

        await tx
          .update(organizationRole)
          .set({ permission: JSON.stringify(catalog) })
          .where(eq(organizationRole.id, catalogRole.id));

        const grantedRoles = await tx
          .select()
          .from(organizationRole)
          .where(and(
            eq(organizationRole.organizationId, data.organizationId),
            ne(organizationRole.role, "owner"),
          ));

        for (const grantedRole of grantedRoles) {
          const grants = JSON.parse(grantedRole.permission) as Record<string, string[]>;

          if (!grants[data.key]) {
            continue;
          }

          delete grants[data.key];

          await tx
            .update(organizationRole)
            .set({ permission: JSON.stringify(grants) })
            .where(eq(organizationRole.id, grantedRole.id));
        }
      });
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not delete this resource.");
    }

    return { key: data.key };
  });

interface UseDeleteResourceOptions {
  mutationConfig?: MutationConfig<typeof deleteResource>;
  organizationId: string;
}

export function useDeleteResource({ mutationConfig, organizationId }: UseDeleteResourceOptions) {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: listResourcesQueryOptions(organizationId).queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteResource,
  });
}
