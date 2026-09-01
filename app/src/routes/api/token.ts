import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";

import { env } from "@/config/env.ts";
import { db } from "@/db/clients/db-client.ts";
import { member, organization, organizationRole } from "@/db/schema/index.ts";
import { mergePermissions, parsePermission } from "@/features/access/lib/permissions.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { splitRoles, SUPER_ADMIN_MEMBER_MARKER } from "@/features/auth/lib/super-admin.ts";

function corsHeaders(origin: string) {
  return {
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-origin": origin,
    "vary": "Origin",
  };
}

async function findApplication(slug: string) {
  const [application] = await db
    .select({ id: organization.id, origin: organization.origin, slug: organization.slug })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  return application;
}

function problem(status: number, message: string, origin?: string) {
  return Response.json(
    { error: message },
    { headers: origin ? corsHeaders(origin) : undefined, status },
  );
}

export const Route = createFileRoute("/api/token")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const slug = new URL(request.url).searchParams.get("application");
        const origin = request.headers.get("origin");

        if (!slug) {
          return problem(400, "Pass ?application=<slug>.");
        }

        const application = await findApplication(slug);

        if (!application) {
          return problem(404, `No application is registered as ${slug}.`);
        }

        if (origin && origin !== application.origin) {
          return problem(403, `${origin} is not the registered origin for ${slug}.`);
        }

        const allowed = origin ?? application.origin;
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
          return problem(401, "Sign in to the gateway first.", allowed);
        }

        const [membership] = await db
          .select({ role: member.role })
          .from(member)
          .where(and(
            eq(member.organizationId, application.id),
            eq(member.userId, session.user.id),
          ))
          .limit(1);

        if (!membership) {
          return problem(403, `You are not a member of ${application.slug}.`, allowed);
        }

        const held = splitRoles(membership.role).filter(role => role !== SUPER_ADMIN_MEMBER_MARKER);

        const rows = await db
          .select({ permission: organizationRole.permission, role: organizationRole.role })
          .from(organizationRole)
          .where(eq(organizationRole.organizationId, application.id));

        const stored = new Map(rows.map(row => [row.role, parsePermission(row.permission)]));

        const { token } = await auth.api.signJWT({
          body: {
            overrideOptions: {
              jwt: {
                audience: application.origin,
                expirationTime: env.TOKEN_LIFETIME,
                issuer: env.BETTER_AUTH_URL,
              },
            },
            payload: {
              application: application.slug,
              email: session.user.email,
              name: session.user.name,
              permissions: mergePermissions(held, stored),
              roles: held.sort(),
              sub: session.user.id,
            },
          },
        });

        return Response.json({ token }, { headers: corsHeaders(allowed) });
      },
      OPTIONS: async ({ request }) => {
        const slug = new URL(request.url).searchParams.get("application");
        const application = slug ? await findApplication(slug) : undefined;
        const origin = request.headers.get("origin");

        if (!application || (origin && origin !== application.origin)) {
          return new Response(null, { status: 403 });
        }

        return new Response(null, { headers: corsHeaders(application.origin), status: 204 });
      },
    },
  },
});
