# Security

This is a sign-in service, so a bug here can hand somebody a token they should not
have. Please report anything along those lines privately.

## Reporting

Open a [private advisory](https://github.com/StephenODea54/better-auth-gateway/security/advisories/new)
on this repository. If that does not work for you, email s.odea@trustetc.com.

Please do not open a public issue, a pull request that fixes it, or a post about it
until there is a release people can move to.

Useful things to include: which version, what an attacker gets, and the smallest
sequence of requests that shows it. A proof of concept against a local
`compose.yaml` stack is ideal.

You should get a reply within a few days. This is a side project rather than a
staffed product, so please be patient with the timeline while a fix is worked out.

## In scope

- Getting a token for an application you are not a member of.
- Getting a token whose `aud` is not the origin registered for that application.
- Permissions or roles in a token that the person does not hold in that application.
- Escalating to gateway super admin, or to an application role, through the
  dashboard or its server functions.
- Reaching another application's members, roles or activity.
- Anything that lets an unauthenticated caller past the SAML flow.

## Out of scope

- Findings that need database access or a valid super admin session to begin with.
- Missing hardening on `compose.yaml`. It is a local development stack, is
  documented as one, and is not a deployment artifact.
- Anything that depends on `BETTER_AUTH_SECRET`, `SSO_IDP_CERT` or the database
  credentials already being disclosed.
- Reports from a scanner with no working exploit behind them.

## Supported versions

Fixes go onto `main` and into the next tagged image. There are no maintained
release branches, so upgrading is the upgrade path.
