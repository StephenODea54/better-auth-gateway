# Development

`compose.yaml` is for local development only. It runs the gateway, a throwaway
Postgres and a mock SAML IdP, so you can exercise the whole sign-in flow without a
real identity provider. It is not a deployment artifact.

## Setup

Compose mints the mock IdP's keypair itself. Run the same script on the host once to
copy the certificate into `.env` as `SSO_IDP_CERT`; it is idempotent and reuses the
keypair compose already made.

```bash
cp .env.example .env   # then fill in BETTER_AUTH_SECRET
docker compose -f ../compose.yaml up -d
sh ../infra/mock-idp/gen-keys.sh
docker compose -f ../compose.yaml up -d app
```

Sign in at `http://localhost:3000` with `Continue with Okta`. The mock IdP is at
`http://localhost:4000` and vouches for any `@example.com` address. The first person
to sign in becomes the gateway super admin.

The `migrate` service applies migrations before the app starts, so there is no
separate migrate step.

## Hot reload

The `app` service runs `vite dev` with `./app` bind-mounted over `/app`, so edits on
the host hot reload without rebuilding the image. `node_modules` sits in a named
volume so the container keeps its own Linux-native binaries instead of the host's.

That volume is populated once when it is created, so after changing dependencies
reset it and rebuild:

```bash
docker compose -f ../compose.yaml rm -sf app
docker volume rm better-auth-gateway_app-node-modules
docker compose -f ../compose.yaml up -d --build app
```

If edits stop triggering reloads, set `VITE_USE_POLLING=1` on the `app` service to
swap the watcher over to polling.

To run the app on the host instead, stop the `app` service so it frees port 3000,
then use `pnpm db:migrate` and `pnpm dev` with `POSTGRES_HOST=localhost`.

## Layout

- `src/routes`: file-based routes. `api/auth/$.ts` mounts Better Auth;
  `api/token.ts` is the token exchange apps call.
- `src/features/*`: one folder per area, each with `api` (server functions and
  their React Query hooks), `components` and `lib`.
- `src/db`: Drizzle schema, migrations and config. `auth-schema.ts` is generated
  by `pnpm auth:generate`; do not edit it by hand.
- `src/config/env.ts`: every environment variable, validated at boot.

## Commands

```bash
pnpm dev              # vite dev server on :3000
pnpm build            # nitro build into .output
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm db:generate      # generate a migration from schema changes
pnpm db:migrate       # apply migrations
pnpm db:studio        # drizzle studio
pnpm auth:generate    # regenerate auth-schema.ts from the Better Auth config
```

## Building the production image

Deployment does not use compose. The `runtime` stage of `Dockerfile` is the image to
publish: it carries only the Nitro build output and runs as the non-root `node` user.

```bash
docker build --target runtime -t auth-gateway ./app
```

Nothing is baked in at build time. Every value in `src/config/env.ts` is read from
the environment when the server boots.
