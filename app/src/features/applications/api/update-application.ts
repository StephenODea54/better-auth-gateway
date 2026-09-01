import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { ssoProvider } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { buildSamlMapping } from "@/features/auth/lib/saml-mapping.ts";
import { setEvent, setEventError } from "@/lib/wide-event.ts";

import { listApplicationsQueryOptions } from "./list-applications.ts";

export const updateApplicationInputSchema = z.object({
  certificate: z.string().min(1, "Required"),
  domain: z.string().min(1, "Required"),
  emailAttribute: z.string(),
  entityId: z.string().min(1, "Required"),
  entryPoint: z.url("Required"),
  firstNameAttribute: z.string(),
  id: z.string().min(1),
  lastNameAttribute: z.string(),
  name: z.string().min(1, "Required"),
  nameAttribute: z.string(),
  origin: z.url("Enter a full URL, for example https://billing.acme.com."),
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationInputSchema>;

export const updateApplication = createServerFn({ method: "POST" })
  .validator(updateApplicationInputSchema)
  .handler(async ({ data }) => {
    setEvent({ "event.kind": "application.updated", "organization.id": data.id });

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
      await auth.api.updateOrganization({
        body: {
          data: {
            name: data.name,
            origin: new URL(data.origin).origin,
          },
          organizationId: data.id,
        },
        headers,
      });
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not update the application.");
    }

    try {
      await auth.api.updateSSOProvider({
        body: {
          domain: data.domain,
          providerId: provider.providerId,
          samlConfig: {
            cert: data.certificate,
            entryPoint: data.entryPoint,
            idpMetadata: { entityID: data.entityId },
            mapping: buildSamlMapping({
              email: data.emailAttribute,
              firstName: data.firstNameAttribute,
              lastName: data.lastNameAttribute,
              name: data.nameAttribute,
            }),
          },
        },
        headers,
      });
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not update this application's identity provider.");
    }

    return { id: data.id, name: data.name };
  });

interface UseUpdateApplicationOptions {
  mutationConfig?: MutationConfig<typeof updateApplication>;
}

export function useUpdateApplication({ mutationConfig }: UseUpdateApplicationOptions = {}) {
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
    mutationFn: updateApplication,
  });
}
