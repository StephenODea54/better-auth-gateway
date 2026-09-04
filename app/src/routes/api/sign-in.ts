import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { db } from "@/db/clients/db-client.ts";
import { organization, ssoProvider } from "@/db/schema/index.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { resolveReturnTo } from "@/features/auth/lib/return-to.ts";
import { setEvent } from "@/lib/wide-event.ts";

export const Route = createFileRoute("/api/sign-in")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("application");

        if (!slug) {
          return Response.json({ error: "Pass ?application=<slug>." }, { status: 400 });
        }

        const [application] = await db
          .select({ id: organization.id, origin: organization.origin, providerId: ssoProvider.providerId })
          .from(organization)
          .innerJoin(ssoProvider, eq(ssoProvider.organizationId, organization.id))
          .where(eq(organization.slug, slug))
          .limit(1);

        if (!application) {
          return Response.json({ error: `No application is registered as ${slug}.` }, { status: 404 });
        }

        setEvent({ "event.kind": "sign-in.requested", "organization.id": application.id });

        const callbackURL = resolveReturnTo(url.searchParams.get("returnTo"), application.origin);
        const session = await auth.api.getSession({ headers: request.headers });

        if (session) {
          return Response.redirect(callbackURL, 302);
        }

        const { url: idpUrl } = await auth.api.signInSSO({
          body: { callbackURL, providerId: application.providerId, providerType: "saml" },
          headers: request.headers,
        });

        return Response.redirect(idpUrl, 302);
      },
    },
  },
});
