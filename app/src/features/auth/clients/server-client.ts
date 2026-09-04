import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, jwt, organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { env } from "@/config/env.ts";
import { db } from "@/db/clients/db-client.ts";
import { ac, roles } from "@/features/auth/lib/access-control.ts";
import { buildSamlMapping } from "@/features/auth/lib/saml-mapping.ts";
import {
  enrollSuperAdmins,
  includesSuperAdminMarker,
  isFirstUser,
  isSuperAdmin,
  isSuperAdminMembership,
  SUPER_ADMIN_MEMBER_MARKER,
  SUPER_ADMIN_ROLE,
  syncSuperAdminMemberships,
} from "@/features/auth/lib/super-admin.ts";
import { trustedOrigins } from "@/features/auth/lib/trusted-origins.ts";
import { setEvent } from "@/lib/wide-event.ts";

interface SessionResult {
  session?: { id?: string };
  user?: { email?: string; id?: string; role?: string };
}

function asSessionResult(value: unknown): SessionResult | undefined {
  if (typeof value !== "object" || value === null || !("user" in value)) {
    return undefined;
  }

  const candidate = value as SessionResult;

  return typeof candidate.user === "object" && candidate.user !== null ? candidate : undefined;
}

function readSuccess(value: unknown) {
  return typeof value === "object" && value !== null && "success" in value && typeof value.success === "boolean"
    ? value.success
    : false;
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          try {
            await syncSuperAdminMemberships(session.userId);
          }
          catch (error) {
            console.error(error);
          }
        },
      },
    },
    user: {
      create: {
        before: async () => {
          if (!await isFirstUser()) {
            return;
          }

          return { data: { role: SUPER_ADMIN_ROLE } };
        },
      },
    },
  },
  disabledPaths: ["/organization/leave", "/token"],
  emailAndPassword: {
    enabled: false,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const session = asSessionResult(ctx.context.session ?? ctx.context.returned);

      if (session?.user) {
        setEvent({
          "session.id": session.session?.id,
          "user.email": session.user.email,
          "user.id": session.user.id,
          "user.role": session.user.role,
        });
      }

      if (ctx.path === "/organization/has-permission") {
        setEvent({
          "authz.allowed": readSuccess(ctx.context.returned),
          "authz.permissions": JSON.stringify(ctx.body?.permissions),
          "organization.id": ctx.body?.organizationId,
        });
      }

      if (ctx.path !== "/admin/set-role") {
        return;
      }

      await syncSuperAdminMemberships(ctx.body.userId);
    }),
    before: createAuthMiddleware(async (ctx) => {
      if (includesSuperAdminMarker(ctx.body?.role)) {
        throw new APIError("BAD_REQUEST", {
          message: `${SUPER_ADMIN_MEMBER_MARKER} is reserved for gateway super admins.`,
        });
      }

      const target = ctx.path === "/organization/remove-member"
        ? ctx.body?.memberIdOrEmail
        : ctx.path === "/organization/update-member-role"
          ? ctx.body?.memberId
          : undefined;

      if (typeof target === "string" && await isSuperAdminMembership(target)) {
        throw new APIError("FORBIDDEN", {
          message: "This person is a gateway super admin. Their access is managed from the gateway, not from this application.",
        });
      }
    }),
  },
  plugins: [
    admin(),
    jwt({
      jwt: {
        expirationTime: env.TOKEN_LIFETIME,
        issuer: env.BETTER_AUTH_URL,
      },
    }),
    organization({
      ac,
      allowUserToCreateOrganization: user => isSuperAdmin(user.role),
      creatorRole: "owner",
      dynamicAccessControl: { enabled: true },
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          try {
            await enrollSuperAdmins(organization.id);
          }
          catch (error) {
            console.error(error);
          }
        },
      },
      roles,
      schema: {
        organization: {
          additionalFields: {
            origin: { input: true, required: true, type: "string" },
          },
        },
      },
    }),
    sso({
      defaultSSO: [{
        domain: env.SSO_EMAIL_DOMAIN,
        providerId: env.SSO_PROVIDER_ID,
        samlConfig: {
          cert: env.SSO_IDP_CERT,
          entryPoint: env.SSO_IDP_ENTRY_POINT,
          identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
          idpMetadata: { entityID: env.SSO_IDP_ENTITY_ID },
          issuer: `${env.BETTER_AUTH_URL}/saml/sp/${env.SSO_PROVIDER_ID}`,
          mapping: buildSamlMapping({
            email: env.SSO_ATTRIBUTE_EMAIL,
            firstName: env.SSO_ATTRIBUTE_FIRST_NAME,
            lastName: env.SSO_ATTRIBUTE_LAST_NAME,
            name: env.SSO_ATTRIBUTE_NAME,
          }),
          wantAssertionsSigned: true,
        },
      }],
      saml: { allowIdpInitiated: true },
    }),
    // Must stay last, or session cookies are silently dropped.
    tanstackStartCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
});
