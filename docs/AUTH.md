# Authentication and admin access

Status: email/password authentication, secure session handling, protected routing, first-business
onboarding, and explicit multi-business admin context are implemented. This is not the final admin
dashboard.

## Session architecture

The admin app follows the Supabase SSR cookie model for Next.js App Router:

- `@darb/database/server` creates a fresh server client for each request and accepts an explicit
  cookie adapter;
- Server Components use a read-only cookie adapter and resolve authenticated identity with
  `auth.getClaims()`;
- Server Actions use a read/write cookie adapter for sign-in and sign-out;
- root `proxy.ts` refreshes auth cookies through `getClaims()` and forwards response cache headers;
- Proxy performs no tenant authorization, and protected routes repeat authorization close to the
  data they render.

There is no global mutable server client. Browser-visible code receives only the Supabase URL and
publishable key. Normal authenticated traffic never uses the privileged client and remains subject
to RLS. Email/password sign-in needs no callback route; a callback will be added if a later OAuth or
magic-link flow requires one.

## Protected routing

The admin app is deployed at `admin.darb.co.il`, so its internal paths do not carry an extra
`/admin` prefix. Authenticated tenant workspaces use `/b/[businessSlug]`.

| Request state                                  | Result                                                  |
| ---------------------------------------------- | ------------------------------------------------------- |
| Unauthenticated protected request              | Redirect to `/login` with a sanitized relative return   |
| Authenticated with zero RLS-visible businesses | Redirect protected routes to `/onboarding`              |
| Authenticated with one visible business        | `/` redirects to that canonical `/b/[businessSlug]`     |
| Authenticated with multiple businesses         | `/` presents the authorized business chooser            |
| Unauthorized business slug                     | Fail closed through the protected unavailable-workspace |

Return paths are normalized to same-origin relative paths before they are retained or used. The
database remains the source of business visibility; a client-supplied business ID never establishes
tenant access.

## First-business bootstrap

Onboarding collects only display name, slug, and default locale. Native client constraints improve
feedback, a typed Server Action parser validates again, and Postgres performs the authoritative
validation.

The action calls `core.bootstrap_first_business` with the normal request-scoped user client. The RPC
derives its caller from `auth.uid()` and atomically creates:

1. the canonical business using the platform ILS and `Asia/Jerusalem` defaults;
2. an active caller membership;
3. business-wide assignments for `business.manage`, `locations.read`, `locations.manage`,
   `memberships.manage`, `permissions.manage`, `modules.manage`, `media.manage`, `domains.manage`,
   and `audit.view`;
4. a `business.created` audit event.

No modules are enabled. The function accepts neither another user ID nor permission keys. Its exact
retry behavior, duplicate-slug rollback, unauthenticated execution, ownership, permission bundle,
audit event, and tenant isolation are verified with pgTAP.

## Application authorization helpers

Small server-only helpers resolve the current claims, list all RLS-visible businesses, locations,
and capability state, list active memberships, resolve an explicit business UUID/slug from the
authorized list, and ask database RPCs for permission, business-wide access, or super-admin
decisions. Helpers fail closed and do not reproduce database policy logic in TypeScript.

`/b/[businessSlug]` is the server-resolved current-business identity. The switcher lists only the
authorized businesses and routes between them. It preserves settings, modules, and the location
list where safe, but never carries a tenant-owned location ID into another business. No security decision
depends on local storage or an unvalidated browser value.

## Environment boundaries

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are browser-visible and rely
  on RLS;
- `SUPABASE_SECRET_KEY` is server-only. Runtime code reads it only for the narrow DNS-result
  attestation RPC; local Playwright also uses the ephemeral local value to create and clean fixtures;
- cleanup refuses non-local database hosts, removes generated Storage objects through the local
  service boundary first, and then removes only the generated user/business fixtures without
  weakening production audit grants.

## Deferred auth work

- account registration and email verification UX;
- password reset and account recovery;
- invitations and acceptance;
- OAuth, magic links, and MFA;
- super-admin UI and operational provisioning;
- detailed session-duration/device management;
- member/invitation administration and the full dashboard analytics experience.
