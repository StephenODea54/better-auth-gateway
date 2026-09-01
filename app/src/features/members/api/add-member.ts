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
import { setEvent, setEventError } from "@/lib/wide-event.ts";

import { listMembersQueryOptions } from "./list-members.ts";

export const addMemberInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter the email address they sign in with.")),
  organizationId: z.string().min(1),
  roles: z.array(z.string().min(1)).min(1, "Pick at least one role."),
});

export type AddMemberInput = z.infer<typeof addMemberInputSchema>;

export const addMember = createServerFn({ method: "POST" })
  .validator(addMemberInputSchema)
  .handler(async ({ data }) => {
    setEvent({ "event.kind": "member.added", "organization.id": data.organizationId });

    type MemberRole = NonNullable<Parameters<typeof auth.api.addMember>[0]>["body"]["role"];

    const { headers } = getRequest();

    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { member: ["create"] },
      },
      headers,
    });

    if (!success) {
      throw new Error("You do not have permission to add members to this application.");
    }

    if (data.roles.includes("owner")) {
      const { role } = await auth.api
        .getActiveMemberRole({ headers, query: { organizationId: data.organizationId } })
        .catch(() => ({ role: "" }));

      const held = role.split(",").map(name => name.trim());

      if (!held.includes("owner")) {
        throw new Error("Only an owner can grant the owner role.");
      }
    }

    const [account] = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (!account) {
      throw new Error(`No one signs in as ${data.email} yet. Ask them to sign in once, then add them.`);
    }

    try {
      await auth.api.addMember({
        body: {
          organizationId: data.organizationId,
          role: data.roles as MemberRole,
          userId: account.id,
        },
        headers,
      });
    }
    catch (error) {
      setEventError(error);

      if (error instanceof APIError) {
        throw new Error(error.message);
      }

      throw new Error("Could not add this member.");
    }

    return { email: data.email, name: account.name, roles: data.roles };
  });

interface UseAddMemberOptions {
  mutationConfig?: MutationConfig<typeof addMember>;
  organizationId: string;
}

export function useAddMember({ mutationConfig, organizationId }: UseAddMemberOptions) {
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
    mutationFn: addMember,
  });
}
