# Contributing

Bug reports, identity provider compatibility reports and pull requests are all
welcome. Security issues go through [SECURITY.md](SECURITY.md) instead of the issue
tracker.

## Before a large change

Small fixes can go straight to a pull request. For anything that adds a page, a
table, an environment variable or an endpoint, open an issue first. The
[Roadmap](README.md#roadmap) says what is already planned and the
[Scope](README.md#scope) section says what this deliberately does not do; a change
that lands on the wrong side of Scope is a hard no, and it is better to find that
out before you write it.

## Getting it running

[app/README.md](app/README.md) is the setup guide. In short, `compose.yaml` brings up
the gateway, a throwaway Postgres and a mock SAML IdP, so you can drive the whole
sign-in flow without a real identity provider. The first account to sign in becomes
the gateway super admin.

Everything runs from `app/`:

```bash
pnpm dev          # vite dev server on :3000
pnpm lint         # eslint, --fix to apply
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm build        # nitro build
```

CI runs lint, typecheck, test and build on every push and pull request. A pre-commit
hook runs `eslint --fix` over staged files, so most style problems fix themselves.

## Working in the codebase

- **Layout.** `src/routes` is file-based routing; `src/features/*` is one folder per
  area, each with `api` (server functions and their React Query hooks), `components`
  and `lib`. Pure logic lives in `lib`, which is also where it becomes testable.
- **Generated files.** `src/db/schema/auth-schema.ts` comes from `pnpm auth:generate`
  and `routeTree.gen.ts` comes from the router. Do not edit either by hand; change
  the source and regenerate.
- **Migrations.** Change the schema, then `pnpm db:generate`. Do not hand-write the
  SQL, and do not edit a migration that has already been merged. Keep the
  `--> statement-breakpoint` lines; they are delimiters, not comments.
- **Environment variables.** Every one is declared and validated in
  `src/config/env.ts`. A new one belongs there, in `app/.env.example`, and in the
  README's configuration table. Nothing is read straight off `process.env`.
- **Comments.** The codebase does not use them. Name things so the code reads
  without them, and keep a comment only where the reason for the code genuinely is
  not in the code — the ordering constraint on `tanstackStartCookies()` is the
  example to compare against.
- **Style.** `@antfu/eslint-config`, with the config in `app/eslint.config.mjs`. Let
  the linter make the formatting decisions rather than arguing with it.

## Tests

Vitest, with test files next to the code they cover (`slugify.test.ts` beside
`slugify.ts`). The current suite covers pure helpers, because those are the parts
that need no database. If you are moving logic somewhere it can be tested without
Postgres, that counts as a welcome change on its own.

## Commits and pull requests

Commit messages follow the existing log: a conventional prefix, lowercase, no
trailing period, describing what the change does.

```
feat: gate access management actions on the caller's permissions
fix: keep table pagination rendered for single page and empty results
docs: document the gateway setup
```

Keep a pull request to one thing. A refactor and a behaviour change in the same
diff cannot be reviewed properly, and cannot be reverted separately either. Say what
you actually ran to check it — the checklist in the pull request template covers the
rest.

## Reporting an IdP problem

Attribute names differ between providers more than anything else does, and the
gateway cannot be tested against every one of them. If yours does not work, the
**IdP compatibility** issue template asks for the attribute names and NameID format
the provider sends. That is usually enough to fix it, and often it turns out to be a
mapping that should have been a default.
