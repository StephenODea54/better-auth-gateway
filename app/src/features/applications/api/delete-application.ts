import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { ssoProvider } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { setEventError } from "@/lib/wide-event.ts";

import { listApplicationsQueryOptions } from "./list-applications.ts";

export const deleteApplicationInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const deleteApplication = createServerFn({ method: "POST" })
  .validator(deleteApplicationInputSchema)
  .handler(async ({ data }) => {
    const headers = getRequest().headers;

    const [provider] = await db
      .select({ providerId: ssoProvider.providerId })
      .from(ssoProvider)
      .where(eq(ssoProvider.organizationId, data.id))
      .limit(1);

    if (!provider) {
      throw new Error("Could not find this application's identity provider.");
    }

    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.id,
        permissions: { organization: ["delete"] },
      },
      headers,
    });

    if (!success) {
      throw new Error("You do not have permission to delete this application.");
    }

    try {
      await auth.api.deleteSSOProvider({
        body: { providerId: provider.providerId },
        headers,
      });
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not disconnect this application's identity provider.");
    }

    try {
      await auth.api.deleteOrganization({
        body: { organizationId: data.id },
        headers,
      });
    }
    catch (error) {
      setEventError(error);
      throw new Error("The identity provider was disconnected, but the application could not be deleted.");
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
