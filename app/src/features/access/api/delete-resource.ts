import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { readCatalog, sweepActions, writeCatalog } from "@/features/access/lib/catalog.ts";
import { requireOrgPermission } from "@/features/auth/lib/guards.ts";
import { toFriendlyError } from "@/lib/errors.ts";
import { setEvent } from "@/lib/wide-event.ts";

import { listResourcesQueryOptions } from "./list-resources.ts";

export const deleteResourceInputSchema = z.object({
  key: z.string().min(1),
  organizationId: z.string().min(1),
});

export const deleteResource = createServerFn({ method: "POST" })
  .validator(deleteResourceInputSchema)
  .handler(async ({ data }) => {
    setEvent({ "event.kind": "resource.deleted", "organization.id": data.organizationId });

    await requireOrgPermission(
      data.organizationId,
      { ac: ["delete"] },
      "You do not have permission to change this application's resources.",
    );

    try {
      await db.transaction(async (tx) => {
        const { catalog, row } = await readCatalog(tx, data.organizationId, { forUpdate: true });

        if (!row) {
          return;
        }

        const revoked = catalog[data.key] ?? [];

        delete catalog[data.key];

        await writeCatalog(tx, data.organizationId, row, catalog);
        await sweepActions(tx, data.organizationId, data.key, revoked);
      });
    }
    catch (error) {
      throw toFriendlyError(error, "Could not delete this resource.");
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
