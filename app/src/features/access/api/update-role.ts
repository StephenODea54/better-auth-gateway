import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { organizationRole } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { ac, roles } from "@/features/auth/lib/access-control.ts";

import { listRolesQueryOptions } from "./list-roles.ts";

export const updateRoleInputSchema = z.object({
  organizationId: z.string().min(1),
  permission: z.record(z.string(), z.array(z.string())),
  role: z.string().min(1),
});

export type UpdateRoleInput = z.infer<typeof updateRoleInputSchema>;

export const updateRole = createServerFn({ method: "POST" })
  .validator(updateRoleInputSchema)
  .handler(async ({ data }) => {
    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { ac: ["update"] },
      },
      headers: getRequest().headers,
    });

    if (!success) {
      throw new Error("You do not have permission to change this application's roles.");
    }

    if (data.role in roles) {
      throw new Error("Built-in roles are defined in code and cannot be edited here.");
    }

    const [existing] = await db
      .select({ id: organizationRole.id })
      .from(organizationRole)
      .where(and(
        eq(organizationRole.organizationId, data.organizationId),
        eq(organizationRole.role, data.role),
      ))
      .limit(1);

    if (!existing) {
      throw new Error("This role no longer exists.");
    }

    const permission: Record<string, string[]> = {};

    try {
      await db.transaction(async (tx) => {
        const [catalogRole] = await tx
          .select({ permission: organizationRole.permission })
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

        const statements = ac.statements as Record<string, readonly string[]>;

        for (const [key, actions] of Object.entries(data.permission)) {
          const available: string[] = [...(statements[key] ?? []), ...(catalog[key] ?? [])];
          const granted = [...new Set(actions)].filter(action => available.includes(action)).sort();

          if (granted.length > 0) {
            permission[key] = granted;
          }
        }

        await tx
          .update(organizationRole)
          .set({ permission: JSON.stringify(permission) })
          .where(eq(organizationRole.id, existing.id));
      });
    }
    catch (error) {
      console.error(error);
      throw new Error("Could not save this role.");
    }

    return { permission, role: data.role };
  });

interface UseUpdateRoleOptions {
  mutationConfig?: MutationConfig<typeof updateRole>;
  organizationId: string;
}

export function useUpdateRole({ mutationConfig, organizationId }: UseUpdateRoleOptions) {
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
    mutationFn: updateRole,
  });
}
