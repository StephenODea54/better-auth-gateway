# Auth Gateway

A small, self-hosted sign-in service for organisations that run a lot of internal
apps. Your people sign in once, against your existing identity provider, and each
app asks the gateway for a short-lived token instead of running authentication of
its own.

## Why this exists

Internal tooling multiplies. You end up with a dozen small serverless apps (a
billing dashboard here, an ops console there), and every one of them needs to know
who is calling and what they are allowed to do.

The usual answer is to give each app its own auth infrastructure: a user pool, a
managed identity service, a database to hold sessions. That is a lot of moving parts
and a lot of line items on a cloud bill for what is, in practice, one question asked
twelve times. It is especially hard to justify when the apps are internal: it is the
same fifty people every time, just signed into different tools.

This gateway is the other answer. One service, one database, one identity provider.
Every app still gets its own tile there, with its own icon and its own assignment
list; the tile just points at the gateway instead of at auth infrastructure of the
app's own. Apps stay stateless. They redirect to the gateway, exchange the
gateway session for a signed token scoped to them, and verify it with a public key.
No SDK to install, no shared secret to distribute, no per-app auth infrastructure.

## How it works

```
                                     ┌───────────────────┐
  ┌────────────┐   SAML              │                   │
  │ Your IdP   │◄────────────────────┤   Auth Gateway    │
  │ (Okta, …)  │                     │                   │
  └────────────┘                     │  Postgres ◄───────┤
                                     └─────────┬─────────┘
                                          ▲    │
                  session cookie          │    │  JWT (aud = your app)
                                          │    ▼
                                     ┌───────────────────┐
                                     │  Your app         │
                                     │  verifies via     │
                                     │  /api/auth/jwks   │
                                     └───────────────────┘
```

1. You create a **SAML app integration at your IdP** for the app, pointed at the
   gateway. A gateway super admin then **registers the application**, recording its
   exact origin and the integration's sign-on URL, issuer and certificate.
2. People are **added as members** of that application and given roles.
3. Someone opens your app, usually from its tile in your IdP. The tile signs them
   into the gateway and drops them back on your app. If they arrive some other way,
   the app calls the gateway's token endpoint with credentials, gets a `401`, and
   sends them to the gateway's sign-in URL, which returns them to the page they were
   on.
4. The gateway hands back a **short-lived JWT** whose audience is the app's
   registered origin, carrying the roles and permissions that person holds *in that
   application only*.
5. The app **verifies the token against the gateway's JWKS**. Nothing is shared
   between the two beyond a public key.

The token endpoint is locked to the origin recorded at registration, so a token
minted for one app cannot be requested from another.

### What is in a token

```json
{
  "sub": "user_01hb…",
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "application": "billing",
  "roles": ["auditor", "support"],
  "permissions": { "invoices": ["read"], "refunds": ["read", "issue"] },
  "aud": "https://billing.example.com",
  "iss": "https://auth.example.com"
}
```

`permissions` is the union of every permission attached to the roles that person
holds in that application. Your app can authorise off `permissions` and never has to
know what your role names mean.

## What you get

A dashboard with five pages:

- **Applications.** Register an app, record its origin, connect its IdP.
- **Members.** Who can reach which application, and in what roles.
- **Roles.** Roles defined per application, at runtime, through the UI.
- **Permissions.** The resources and actions each application recognises, also
  defined at runtime. This is the part that is not stock Better Auth.
- **Activity.** One wide event per request, retained for ninety days.

Most of the behaviour underneath is [Better Auth](https://www.better-auth.com);
its organization, admin, JWT and SSO plugins do the heavy lifting. The custom work
is the dynamic resource and permission model, the token endpoint, and the dashboard.

## Requirements

- A **Postgres database**. The gateway does not ship one; you point it at yours.
- A **SAML 2.0 identity provider**. Okta, Entra ID, Google Workspace, OneLogin,
  JumpCloud, Keycloak. Nothing here is specific to one vendor.
- Somewhere to run **one container**.

## Running it

The published image is the gateway itself, a Node server built by the `runtime`
stage of [app/Dockerfile](app/Dockerfile).

```bash
docker pull ghcr.io/stephenodea54/better-auth-gateway:latest
```

Or build it yourself:

```bash
docker build --target runtime -t auth-gateway ./app
```

Nothing is baked in at build time. Every value in
[app/src/config/env.ts](app/src/config/env.ts) is read from the environment at boot,
so the same image runs in every environment.

### Migrations

The image carries its own migrations and applies any that are pending when the
container starts, before the server begins listening. Starting several replicas at
once is safe: each runner takes a Postgres advisory lock, so one applies the
migrations and the rest wait, then find nothing left to do. If a migration fails the
container exits non-zero and the server never starts, so a bad upgrade shows up in
your orchestrator rather than at the first request.

To run migrations as a separate step instead (a Kubernetes Job, a one-off ECS task,
or because the server's database user may not alter the schema), set
`MIGRATE_ON_BOOT=false` on the server and run the same image with `migrate`:

```bash
docker run --rm --env-file .env ghcr.io/stephenodea54/better-auth-gateway:latest migrate
```

The `migrate` command reads only the `POSTGRES_*` variables. Use the same tag for
both steps: the migrations live inside the image, so the version you migrate with
is the version you run.

The first person to sign in becomes the gateway super admin. Super admins are the
only people who can register applications, and they are enrolled into every
application automatically.

### Health

`GET /health` returns `200` with `{"status":"ok"}` and never touches the database. That
is deliberate: it says the process is up and serving, nothing more. A probe that queried
Postgres would keep a serverless cluster from ever pausing, and would take every
replica out of rotation the moment the database blinked, which turns a short outage
into a long one. Point load balancer and orchestrator checks at it; the image's own
`HEALTHCHECK` already does. Requests to it are logged but never stored as activity.

## Configuration

| Variable | Required | What it is |
| --- | --- | --- |
| `BETTER_AUTH_URL` | yes | Public URL of the gateway. Also the `iss` of every token. |
| `BETTER_AUTH_SECRET` | yes | Signing secret. Generate with `npx @better-auth/cli secret`. |
| `POSTGRES_HOST` | yes | Your database. |
| `POSTGRES_PORT` | yes | |
| `POSTGRES_DB` | yes | |
| `POSTGRES_USER` | yes | |
| `POSTGRES_PASSWORD` | yes | |
| `POSTGRES_SSLMODE` | no | `disable`, `require` or `verify-full`. Unset behaves as `disable`, which is what a local Postgres container wants. Managed Postgres generally refuses unencrypted connections — Aurora PostgreSQL 17 sets `rds.force_ssl=1` — so set `require` there. `verify-full` checks the certificate against the system trust store, which works where your provider uses a publicly trusted CA and not for Amazon RDS, whose roots are not in it. |
| `SSO_IDP_ENTRY_POINT` | yes | Your IdP's SAML sign-on URL, for signing into the gateway. |
| `SSO_IDP_ENTITY_ID` | yes | Your IdP's entity ID. |
| `SSO_IDP_CERT` | yes | Your IdP's signing certificate, base64 encoded. |
| `SSO_EMAIL_DOMAIN` | yes | Email domain routed to that provider. |
| `APP_NAME` | no | Shown in the browser title. Defaults to `Auth Gateway`. |
| `SSO_PROVIDER_NAME` | no | What the sign-in button calls your IdP. Defaults to `SSO`. |
| `SSO_PROVIDER_ID` | no | Internal key for the gateway's own provider. Defaults to `gateway`. |
| `TOKEN_LIFETIME` | no | Lifetime of issued tokens. Defaults to `15m`. |
| `MIGRATE_ON_BOOT` | no | Apply pending migrations when the container starts. Defaults to `true`. |
| `NODE_ENV` | no | Defaults to `development`. |

`SSO_PROVIDER_ID` is stored in the database, so changing it on a running deployment
orphans the existing provider row. Pick it once, before you go live.

[app/.env.example](app/.env.example) has the same list in copyable form.

### Attribute mapping

The gateway reads a person's email from the SAML `NameID`, which every IdP sends, so
sign-in works out of the box. Display names are less consistent: it looks for
`givenName` and `surname`, then `displayName`, and falls back to the email address.

If your IdP names those attributes differently (Entra ID sends full claim URIs, for
example), override them with `SSO_ATTRIBUTE_EMAIL`, `SSO_ATTRIBUTE_NAME`,
`SSO_ATTRIBUTE_FIRST_NAME` and `SSO_ATTRIBUTE_LAST_NAME`. Each registered application
has the same four fields on its own form, under **Attribute mapping**.

## Connecting an app to your IdP

This is the one way the gateway is meant to be used: **one SAML app integration at
your IdP per application**, every one of them pointed at the gateway. Each app keeps
its own tile, icon and assignment list, and the gateway is the only service provider
behind all of them. There is no single "gateway" tile that people sign into and then
navigate away from.

The IdP side comes first, because the gateway's registration form needs the sign-on
URL, issuer and certificate the IdP hands out. The two values the IdP needs from you
depend only on the application's slug, which is its name lowercased with runs of
anything other than letters and digits collapsed to a hyphen (`Billing Portal` →
`billing-portal`):

| Your IdP calls it | Value |
| --- | --- |
| Single sign-on URL, ACS URL, Recipient URL, Destination URL | `https://auth.example.com/api/auth/sso/saml2/sp/acs/<slug>` |
| Audience URI, SP entity ID, Audience Restriction | `https://auth.example.com/saml/sp/<slug>` |

The audience is *not* the metadata URL, even though other Better Auth deployments use
that. Once the app is registered, both values appear in the **Applications** table
with copy buttons; check them against what you typed.

Clicking the tile posts an assertion straight to that app's ACS. The gateway signs the
person in and redirects to the app's registered origin. Assigning people to the tile
in your IdP controls who can start that flow; membership in the gateway controls who
gets a token. Keep the two lists in step.

### Okta, step by step

Say the app is called `Billing Portal`, so its slug is `billing-portal`, and the
gateway runs at `https://auth.example.com`.

1. **Applications → Applications → Create App Integration.** Pick *SAML 2.0*.
2. **General Settings.** App name `Billing Portal`. The logo becomes the tile icon.
3. **Configure SAML.**

   | Okta field | Value |
   | --- | --- |
   | Single sign-on URL | `https://auth.example.com/api/auth/sso/saml2/sp/acs/billing-portal` |
   | Use this for Recipient URL and Destination URL | leave ticked |
   | Audience URI (SP Entity ID) | `https://auth.example.com/saml/sp/billing-portal` |
   | Default RelayState | blank |
   | Name ID format | `EmailAddress` |
   | Application username | `Email` |

   Under *Attribute Statements*, add `givenName` → `user.firstName` and `surname` →
   `user.lastName`. Those are the names the gateway looks for by default, so the
   attribute mapping fields on the registration form can stay empty.

4. **Feedback.** "This is an internal app that we have created". Finish.
5. **Sign On tab.** Under *SAML 2.0* / *Metadata details*, copy three things into
   the gateway's **Register application** form:

   | Okta shows | Gateway field |
   | --- | --- |
   | Sign on URL (Identity Provider Single Sign-On URL) | Identity provider single sign-on URL |
   | Issuer (Identity Provider Issuer) | Identity provider issuer |
   | Signing Certificate (X.509, download or copy) | X.509 signing certificate |

   Fill in *Name* (`Billing Portal`), *Origin* (`https://billing.example.com`) and
   *Email domain* (the domain your people sign in with). Register.
6. **Assignments tab.** Assign the people or groups who should see the tile. Add the
   same people as members of the application in the gateway and give them roles.

Once saved, Okta's summary shows the same fields under different names: *Single
Sign On URL*, *Recipient URL* and *Destination URL* should all read the ACS URL above,
and *Audience Restriction* should read the audience URI. For an application that is
`/saml/sp/<slug>`; if it ends in `/metadata` instead, sign-in succeeds at Okta and then
fails at the gateway with an audience mismatch.

The gateway's own dashboard is one more Okta app, with only admins assigned to it. Its
slug is `SSO_PROVIDER_ID` (`gateway` by default), and its sign-on URL, issuer and
certificate go in `SSO_IDP_ENTRY_POINT`, `SSO_IDP_ENTITY_ID` and `SSO_IDP_CERT` rather
than the form.

Its **audience is different from an application's**, and this is the one place the two
diverge:

| | Audience URI |
| --- | --- |
| The gateway's own app | `https://auth.example.com/api/auth/sso/saml2/sp/metadata` |
| A registered application | `https://auth.example.com/saml/sp/<slug>` |

The gateway's own app is exactly what
[the Better Auth Okta guide](https://better-auth.com/docs/guides/saml-sso-with-okta)
describes, so its values are the guide's values, unchanged. Registered applications get an
audience of their own instead, because the metadata URL carries its provider in a query
parameter rather than the path and so is identical for every provider. Distinct audiences
mean an assertion minted for one application is rejected at another's callback, which
matters here in a way it does not for a single-app deployment — assuming your IdP signs
each app with its own key, that check is the second line of defence rather than the
first.

## Integrating an app

Point a Better Auth client at the gateway. The gateway answers `/api/auth/*` requests
from registered origins with CORS headers, so the client works from your app's own
domain:

```ts
import { ssoClient } from "@better-auth/sso/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: GATEWAY_URL,
  plugins: [ssoClient()],
});
```

`authClient.useSession()` tells you whether there is a gateway session. When there is
not, start sign-in for your app and say where to come back to:

```ts
await authClient.signIn.sso({
  callbackURL: window.location.href,
  providerId: "billing",
  providerType: "saml",
});
```

`providerId` is the application's slug. `callbackURL` must sit on the app's registered
origin. `authClient.signOut()` ends the gateway session for every app.

If you would rather not ship a client, `GET /api/sign-in?application=billing&returnTo=…`
does the same thing as a plain redirect. Someone who already has a gateway session is
sent back immediately without visiting the IdP.

Then ask for a token:

```ts
const response = await fetch(`${GATEWAY_URL}/api/token?application=billing`, {
  credentials: "include",
});

const { token } = await response.json();
```

Verify it on your side against the gateway's public keys:

```ts
import { createRemoteJWKSet, jwtVerify } from "jose";

const jwks = createRemoteJWKSet(new URL(`${GATEWAY_URL}/api/auth/jwks`));

const { payload } = await jwtVerify(token, jwks, {
  audience: "https://billing.example.com",
  issuer: GATEWAY_URL,
});

if (!payload.permissions?.invoices?.includes("read")) {
  throw new Response("Forbidden", { status: 403 });
}
```

That is the whole integration. No auth tables in your app.

## Local development

[app/README.md](app/README.md) covers the development setup: `compose.yaml` runs the
gateway, a throwaway Postgres and a mock SAML IdP so you can exercise the full
sign-in flow without touching a real identity provider. **Compose is for local
development only.** It is not a deployment artifact, and the Postgres in it is not
meant to hold anything you care about.

## Scope

Things this deliberately does not do:

- **No password sign-in.** Identity comes from your IdP.
- **Not a general-purpose IdP.** It sits behind yours; it does not replace it.
- **Built for internal apps**, where the same population of people uses every app.
  It is not designed for customer-facing sign-up.

## Roadmap

Rough order, not dates, and nothing here is a promise. Most of it is a rough edge
somebody will hit before I do; if one of these is in your way, say so on an issue
and it moves up.

### Next

- **Rate limits on `/api/token`.** Nothing throttles the endpoint, and it does a
  database lookup before it checks for a session.
- **Tests against a real database.** The suite covers pure helpers. The token
  endpoint, the permission writes and the super admin sync are the parts most worth
  pinning down, and all three need Postgres.

### Later

- **More than one origin per application.** `origin` is a single column, so staging
  and production have to be registered as separate applications, with their roles
  and members maintained twice.
- **Signing key rotation.** Keys are created once and never rolled. Rotation means
  publishing the new key, waiting out `TOKEN_LIFETIME`, then retiring the old one.
- **Configurable activity retention.** Ninety days is a constant in
  [wide-event.ts](app/src/lib/wide-event.ts).
- **More than one gateway IdP.** `SSO_EMAIL_DOMAIN` routes one domain. A second
  company domain, or contractors in a separate tenant, needs a second provider.
- **Roles from SAML attributes.** Roles are assigned in the dashboard. Reading them
  from a group claim would let a directory that already models this drive it.

### Under consideration

- **Standard OIDC.** The token endpoint is a small custom protocol. A discovery
  document and an authorization code flow would let anything that already speaks
  OIDC integrate with no bespoke code, at the cost of a much larger surface to get
  right.
- **Machine tokens.** A client credentials path for scheduled jobs and
  service-to-service calls, which have no person and no browser session.
- **Activity export.** Shipping wide events to a SIEM instead of only reading them
  in the dashboard.

## Contributing

Bug reports, IdP compatibility reports and pull requests are all welcome.
[CONTRIBUTING.md](CONTRIBUTING.md) covers the development loop and what a reviewable
change looks like; [app/README.md](app/README.md) covers the setup itself. Security
issues go through [SECURITY.md](SECURITY.md) rather than the issue tracker.

## License

[MIT](LICENSE).
