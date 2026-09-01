import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import type { MutationConfig } from "@/lib/react-query.ts";

import { env } from "@/config/env.ts";
import { slugify } from "@/features/applications/lib/slugify.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { buildSamlMapping } from "@/features/auth/lib/saml-mapping.ts";
import { isSuperAdmin } from "@/features/auth/lib/super-admin.ts";
import { setEvent, setEventError } from "@/lib/wide-event.ts";

import { listApplicationsQueryOptions } from "./list-applications.ts";

export const registerApplicationInputSchema = z.object({
  certificate: z.string().min(1, "Required"),
  domain: z.string().min(1, "Required"),
  emailAttribute: z.string(),
  entityId: z.string().min(1, "Required"),
  entryPoint: z.url("Required"),
  firstNameAttribute: z.string(),
  lastNameAttribute: z.string(),
  name: z
    .string()
    .min(1, "Required")
    .refine(value => slugify(value).length > 0, "Use at least one letter or number."),
  nameAttribute: z.string(),
  origin: z.url("Enter a full URL, for example https://billing.acme.com."),
});

export type RegisterApplicationInput = z.infer<typeof registerApplicationInputSchema>;

export const registerApplication = createServerFn({ method: "POST" })
  .validator(registerApplicationInputSchema)
  .handler(async ({ data }) => {
    const headers = getRequest().headers;
    const session = await auth.api.getSession({ headers });

    if (!session || !isSuperAdmin(session.user.role)) {
      throw new Error("Only a gateway super admin can register an application.");
    }

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
      setEventError(error);
      throw new Error("Could not create the application.");
    }

    if (!application) {
      throw new Error("Could not create the application.");
    }

    setEvent({ "event.kind": "application.registered", "organization.id": application.id });

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
            mapping: buildSamlMapping({
              email: data.emailAttribute,
              firstName: data.firstNameAttribute,
              lastName: data.lastNameAttribute,
              name: data.nameAttribute,
            }),
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

      setEventError(error);
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
