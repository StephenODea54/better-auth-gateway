import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { organizationRole } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { roles } from "@/features/auth/lib/access-control.ts";
import { SUPER_ADMIN_MEMBER_MARKER } from "@/features/auth/lib/super-admin.ts";
import { setEventError } from "@/lib/wide-event.ts";

import { listRolesQueryOptions } from "./list-roles.ts";

export const createRoleInputSchema = z.object({
  organizationId: z.string().min(1),
  role: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9][a-z0-9_-]*$/, "Use lowercase letters, numbers, hyphens and underscores."),
});

export type CreateRoleInput = z.infer<typeof createRoleInputSchema>;

export const createRole = createServerFn({ method: "POST" })
  .validator(createRoleInputSchema)
  .handler(async ({ data }) => {
    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { ac: ["create"] },
      },
      headers: getRequest().headers,
    });

    if (!success) {
      throw new Error("You do not have permission to change this application's roles.");
    }

    if (data.role in roles || data.role === SUPER_ADMIN_MEMBER_MARKER) {
      throw new Error(`${data.role} is a built-in role name.`);
    }

    const [existing] = await db
      .select({ id: organizationRole.id })
      .from(organizationRole)
      .where(and(
        eq(organizationRole.organizationId, data.organizationId),
        eq(organizationRole.role, data.role),
      ))
      .limit(1);

    if (existing) {
      throw new Error(`This application already has a role named ${data.role}.`);
    }

    try {
      await db.insert(organizationRole).values({
        createdAt: new Date(),
        id: crypto.randomUUID(),
        organizationId: data.organizationId,
        permission: "{}",
        role: data.role,
      });
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not create this role.");
    }

    return { role: data.role };
  });

interface UseCreateRoleOptions {
  mutationConfig?: MutationConfig<typeof createRole>;
  organizationId: string;
}

export function useCreateRole({ mutationConfig, organizationId }: UseCreateRoleOptions) {
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
    mutationFn: createRole,
  });
}
