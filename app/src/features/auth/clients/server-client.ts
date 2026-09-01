import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { env } from "@/config/env.ts";
import { db } from "@/db/clients/db-client.ts";
import { ac, roles } from "@/features/auth/lib/access-control.ts";

const SSO_PROVIDER_ID = "okta";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    organization({
      ac,
      creatorRole: "owner",
      dynamicAccessControl: { enabled: true },
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
        providerId: SSO_PROVIDER_ID,
        samlConfig: {
          cert: env.SSO_IDP_CERT,
          entryPoint: env.SSO_IDP_ENTRY_POINT,
          identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
          idpMetadata: { entityID: env.SSO_IDP_ENTITY_ID },
          issuer: `${env.BETTER_AUTH_URL}/saml/sp/${SSO_PROVIDER_ID}`,
          mapping: { email: "email", name: "firstName" },
          wantAssertionsSigned: true,
        },
      }],
      saml: { allowIdpInitiated: false },
    }),
    // Must stay last, or session cookies are silently dropped.
    tanstackStartCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
});
