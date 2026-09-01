## What this changes

<!-- What it does, and why. Link the issue if there is one. -->

## How it was checked

<!-- What you actually ran or clicked. "Signed in against the mock IdP and the
     token carried the new claim" beats "tested locally". -->

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass
- [ ] Schema changes ship with a generated migration (`pnpm db:generate`), not a
      hand-written one, and `auth-schema.ts` was regenerated with `pnpm auth:generate`
      rather than edited
- [ ] New environment variables are in `src/config/env.ts`, `.env.example` and the
      README's configuration table
- [ ] Anything that changes how the gateway is run, configured or integrated with is
      reflected in `README.md` or `app/README.md`
- [ ] No new comments explaining code that could say it itself

## Anything to flag

<!-- Migrations that lock, behaviour that changes for existing deployments, a
     decision you are unsure about. Delete if there is none. -->
