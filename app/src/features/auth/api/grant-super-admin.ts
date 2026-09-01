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
import { isSuperAdmin, withSuperAdminRole } from "@/features/auth/lib/super-admin.ts";
import { setEvent, setEventError } from "@/lib/wide-event.ts";

import { listSuperAdminsQueryOptions } from "./list-super-admins.ts";

export const grantSuperAdminInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter the email address they sign in with.")),
});

export type GrantSuperAdminInput = z.infer<typeof grantSuperAdminInputSchema>;

export const grantSuperAdmin = createServerFn({ method: "POST" })
  .validator(grantSuperAdminInputSchema)
  .handler(async ({ data }) => {
    setEvent({ "event.kind": "super_admin.granted" });

    type UserRole = NonNullable<Parameters<typeof auth.api.setRole>[0]>["body"]["role"];

    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    if (!session || !isSuperAdmin(session.user.role)) {
      throw new Error("Only gateway super admins can promote other super admins.");
    }

    const [account] = await db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (!account) {
      throw new Error(`No one signs in as ${data.email} yet. Ask them to sign in once, then promote them.`);
    }

    if (isSuperAdmin(account.role)) {
      throw new Error(`${account.name} is already a gateway super admin.`);
    }

    try {
      await auth.api.setRole({
        body: { role: withSuperAdminRole(account.role) as UserRole, userId: account.id },
        headers,
      });
    }
    catch (error) {
      setEventError(error);

      if (error instanceof APIError) {
        throw new Error(error.message);
      }

      throw new Error("Could not promote this person to super admin.");
    }

    return { email: data.email, name: account.name };
  });

interface UseGrantSuperAdminOptions {
  mutationConfig?: MutationConfig<typeof grantSuperAdmin>;
}

export function useGrantSuperAdmin({ mutationConfig }: UseGrantSuperAdminOptions = {}) {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: listSuperAdminsQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: grantSuperAdmin,
  });
}
