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

const identifier = z
  .string()
  .min(1, "Required")
  .regex(/^[a-z0-9][a-z0-9_-]*$/, "Use lowercase letters, numbers, hyphens and underscores.");

export const createResourceInputSchema = z.object({
  actions: z.array(identifier).min(1, "Add at least one action."),
  key: identifier,
  organizationId: z.string().min(1),
});

export type CreateResourceInput = z.infer<typeof createResourceInputSchema>;

export const createResource = createServerFn({ method: "POST" })
  .validator(createResourceInputSchema)
  .handler(async ({ data }) => {
    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { ac: ["create"] },
      },
      headers: getRequest().headers,
    });

    if (!success) {
      throw new Error("You do not have permission to change this application's resources.");
    }

    const actions = [...new Set(data.actions)].sort();

    try {
      await db.transaction(async (tx) => {
        const [catalogRole] = await tx
          .select()
          .from(organizationRole)
          .where(and(
            eq(organizationRole.organizationId, data.organizationId),
            eq(organizationRole.role, "owner"),
          ))
          .limit(1)
          .for("update");

        const catalog = catalogRole
          ? JSON.parse(catalogRole.permission) as Record<string, string[]>
          : {};

        const revoked = (catalog[data.key] ?? []).filter(action => !actions.includes(action));

        catalog[data.key] = actions;

        if (catalogRole) {
          await tx
            .update(organizationRole)
            .set({ permission: JSON.stringify(catalog) })
            .where(eq(organizationRole.id, catalogRole.id));
        }
        else {
          await tx.insert(organizationRole).values({
            createdAt: new Date(),
            id: crypto.randomUUID(),
            organizationId: data.organizationId,
            permission: JSON.stringify(catalog),
            role: "owner",
          });
        }

        if (revoked.length === 0) {
          return;
        }

        const grantedRoles = await tx
          .select()
          .from(organizationRole)
          .where(and(
            eq(organizationRole.organizationId, data.organizationId),
            ne(organizationRole.role, "owner"),
          ))
          .for("update");

        for (const grantedRole of grantedRoles) {
          const grants = JSON.parse(grantedRole.permission) as Record<string, string[]>;
          const granted = grants[data.key];

          if (!granted) {
            continue;
          }

          const remaining = granted.filter(action => !revoked.includes(action));

          if (remaining.length === granted.length) {
            continue;
          }

          if (remaining.length === 0) {
            delete grants[data.key];
          }
          else {
            grants[data.key] = remaining;
          }

          await tx
            .update(organizationRole)
            .set({ permission: JSON.stringify(grants) })
            .where(eq(organizationRole.id, grantedRole.id));
        }
      });
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not save this resource.");
    }

    return { actions, key: data.key };
  });

interface UseCreateResourceOptions {
  mutationConfig?: MutationConfig<typeof createResource>;
  organizationId: string;
}

export function useCreateResource({ mutationConfig, organizationId }: UseCreateResourceOptions) {
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
    mutationFn: createResource,
  });
}
