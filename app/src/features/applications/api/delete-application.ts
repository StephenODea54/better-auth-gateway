import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { ssoProvider } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { requireOrgPermission } from "@/features/auth/lib/guards.ts";
import { toFriendlyError } from "@/lib/errors.ts";
import { setEvent } from "@/lib/wide-event.ts";

import { listApplicationsQueryOptions } from "./list-applications.ts";

export const deleteApplicationInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const deleteApplication = createServerFn({ method: "POST" })
  .validator(deleteApplicationInputSchema)
  .handler(async ({ data }) => {
    setEvent({ "event.kind": "application.deleted", "organization.id": data.id });

    await requireOrgPermission(data.id, { organization: ["delete"] }, "You do not have permission to delete this application.");

    const headers = getRequest().headers;

    const [provider] = await db
      .select({ providerId: ssoProvider.providerId })
      .from(ssoProvider)
      .where(eq(ssoProvider.organizationId, data.id))
      .limit(1);

    if (!provider) {
      throw new Error("Could not find this application's identity provider.");
    }

    try {
      await auth.api.deleteSSOProvider({
        body: { providerId: provider.providerId },
        headers,
      });
    }
    catch (error) {
      throw toFriendlyError(error, "Could not disconnect this application's identity provider.");
    }

    try {
      await auth.api.deleteOrganization({
        body: { organizationId: data.id },
        headers,
      });
    }
    catch (error) {
      throw toFriendlyError(error, "The identity provider was disconnected, but the application could not be deleted.");
    }

    return { id: data.id, name: data.name };
  });

interface UseDeleteApplicationOptions {
  mutationConfig?: MutationConfig<typeof deleteApplication>;
}

export function useDeleteApplication({ mutationConfig }: UseDeleteApplicationOptions = {}) {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: listApplicationsQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteApplication,
  });
}
