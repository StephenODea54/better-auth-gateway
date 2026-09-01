import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { user } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { isSuperAdmin, withoutSuperAdminRole } from "@/features/auth/lib/super-admin.ts";
import { setEvent, setEventError } from "@/lib/wide-event.ts";

import { listSuperAdminsQueryOptions } from "./list-super-admins.ts";

export const revokeSuperAdminInputSchema = z.object({
  userId: z.string().min(1),
});

export const revokeSuperAdmin = createServerFn({ method: "POST" })
  .validator(revokeSuperAdminInputSchema)
  .handler(async ({ data }) => {
    setEvent({ "event.kind": "super_admin.revoked" });

    type UserRole = NonNullable<Parameters<typeof auth.api.setRole>[0]>["body"]["role"];

    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    if (!session || !isSuperAdmin(session.user.role)) {
      throw new Error("Only gateway super admins can revoke super admin access.");
    }

    if (data.userId === session.user.id) {
      throw new Error("You cannot revoke your own super admin access. Ask another super admin to do it.");
    }

    const [account] = await db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1);

    if (!account) {
      throw new Error("This account no longer exists.");
    }

    if (!isSuperAdmin(account.role)) {
      throw new Error(`${account.name} is not a gateway super admin.`);
    }

    try {
      await auth.api.setRole({
        body: { role: withoutSuperAdminRole(account.role) as UserRole, userId: account.id },
        headers,
      });
    }
    catch (error) {
      setEventError(error);

      if (error instanceof APIError) {
        throw new Error(error.message);
      }

      throw new Error("Could not revoke this person's super admin access.");
    }

    return { name: account.name };
  });

interface UseRevokeSuperAdminOptions {
  mutationConfig?: MutationConfig<typeof revokeSuperAdmin>;
}

export function useRevokeSuperAdmin({ mutationConfig }: UseRevokeSuperAdminOptions = {}) {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: listSuperAdminsQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: revokeSuperAdmin,
  });
}
