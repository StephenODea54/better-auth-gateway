import { queryOptions, useQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { env } from "@/config/env.ts";
import { db } from "@/db/clients/db-client.ts";
import { member, organization, ssoProvider } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { toFriendlyError } from "@/lib/errors.ts";

export const listApplications = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers });

  if (!session) {
    throw redirect({ to: "/" });
  }

  try {
    const rows = await db
      .select({
        audienceUri: ssoProvider.issuer,
        domain: ssoProvider.domain,
        id: organization.id,
        name: organization.name,
        origin: organization.origin,
        providerId: ssoProvider.id,
        providerName: ssoProvider.providerId,
        samlConfig: ssoProvider.samlConfig,
      })
      .from(organization)
      .innerJoin(member, eq(member.organizationId, organization.id))
      .innerJoin(ssoProvider, eq(ssoProvider.organizationId, organization.id))
      .where(eq(member.userId, session.user.id))
      .orderBy(organization.name);

    return rows.map((row) => {
      const samlConfig = JSON.parse(row.samlConfig ?? "{}") as {
        cert?: string;
        entryPoint?: string;
        idpMetadata?: { entityID?: string };
        mapping?: {
          email?: string;
          firstName?: string;
          lastName?: string;
          name?: string;
        };
      };

      return {
        acsUrl: `${env.BETTER_AUTH_URL}/api/auth/sso/saml2/sp/acs/${row.providerName}`,
        audienceUri: row.audienceUri,
        id: row.id,
        name: row.name,
        origin: row.origin,
        ssoProvider: {
          certificate: samlConfig.cert ?? "",
          domain: row.domain,
          emailAttribute: samlConfig.mapping?.email ?? "",
          entityId: samlConfig.idpMetadata?.entityID ?? "",
          entryPoint: samlConfig.entryPoint ?? "",
          firstNameAttribute: samlConfig.mapping?.firstName ?? "",
          id: row.providerId,
          lastNameAttribute: samlConfig.mapping?.lastName ?? "",
          name: row.providerName,
          nameAttribute: samlConfig.mapping?.name ?? "",
        },
      };
    });
  }
  catch (error) {
    throw toFriendlyError(error, "Error loading applications");
  }
});

export type Application = ApiFnReturnType<typeof listApplications>[number];

interface UseApplicationsOptions {
  queryConfig?: QueryConfig<typeof listApplicationsQueryOptions>;
}

export function listApplicationsQueryOptions() {
  return queryOptions({
    queryFn: () => listApplications(),
    queryKey: ["applications"],
  });
}

export function useApplications({ queryConfig }: UseApplicationsOptions = {}) {
  return useQuery({
    ...listApplicationsQueryOptions(),
    ...queryConfig,
  });
}
