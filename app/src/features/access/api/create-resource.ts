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
    setEvent({ "event.kind": "resource.saved", "organization.id": data.organizationId });

    await requireOrgPermission(
      data.organizationId,
      { ac: ["create"] },
      "You do not have permission to change this application's resources.",
    );

    const actions = [...new Set(data.actions)].sort();

    try {
      await db.transaction(async (tx) => {
        const { catalog, row } = await readCatalog(tx, data.organizationId, { forUpdate: true });

        const revoked = (catalog[data.key] ?? []).filter(action => !actions.includes(action));

        catalog[data.key] = actions;

        await writeCatalog(tx, data.organizationId, row, catalog);
        await sweepActions(tx, data.organizationId, data.key, revoked);
      });
    }
    catch (error) {
      throw toFriendlyError(error, "Could not save this resource.");
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
