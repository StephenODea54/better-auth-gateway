import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { env } from "@/config/env.ts";
import { slugify } from "@/features/applications/lib/slugify.ts";
import { auth } from "@/features/auth/clients/server-client.ts";

import { listApplicationsQueryOptions } from "./list-applications.ts";

export const registerApplicationInputSchema = z.object({
  certificate: z.string().min(1, "Required"),
  domain: z.string().min(1, "Required"),
  entityId: z.string().min(1, "Required"),
  entryPoint: z.url("Required"),
  name: z
    .string()
    .min(1, "Required")
    .refine(value => slugify(value).length > 0, "Use at least one letter or number."),
  origin: z.url("Enter a full URL, for example https://billing.acme.com."),
});

export type RegisterApplicationInput = z.infer<typeof registerApplicationInputSchema>;

export const registerApplication = createServerFn({ method: "POST" })
  .validator(registerApplicationInputSchema)
  .handler(async ({ data }) => {
    const headers = getRequest().headers;
    const slug = slugify(data.name);

    let application;

    try {
      application = await auth.api.createOrganization({
        body: {
          keepCurrentActiveOrganization: true,
          name: data.name,
          origin: new URL(data.origin).origin,
          slug,
        },
        headers,
      });
    }
    catch (error) {
      console.error(error);
      throw new Error("Could not create the application.");
    }

    if (!application) {
      throw new Error("Could not create the application.");
    }

    try {
      await auth.api.registerSSOProvider({
        body: {
          domain: data.domain,
          issuer: `${env.BETTER_AUTH_URL}/saml/sp/${slug}`,
          organizationId: application.id,
          providerId: slug,
          samlConfig: {
            cert: data.certificate,
            entryPoint: data.entryPoint,
            identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
            idpMetadata: { entityID: data.entityId },
            mapping: { email: "email", name: "firstName" },
            wantAssertionsSigned: true,
          },
        },
        headers,
      });
    }
    catch (error) {
      await auth.api.deleteOrganization({
        body: { organizationId: application.id },
        headers,
      });

      console.error(error);
      throw new Error("Could not connect this application's identity provider. Try a different name.");
    }

    return { id: application.id, name: application.name, slug: application.slug };
  });

interface UseRegisterApplicationOptions {
  mutationConfig?: MutationConfig<typeof registerApplication>;
}

export function useRegisterApplication({ mutationConfig }: UseRegisterApplicationOptions = {}) {
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
    mutationFn: registerApplication,
  });
}
