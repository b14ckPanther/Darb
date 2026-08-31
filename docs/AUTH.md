# Authentication and admin access

Status: Phase 3 email/password authentication, secure session handling, protected routing, and
first-business onboarding are implemented. This is not the final admin dashboard.

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

The admin app is deployed at `admin.darb.co.il`, so its internal paths are `/login`, `/onboarding`,
and `/` rather than carrying an extra `/admin` prefix.

| Request state                                  | Result                                        |
| ---------------------------------------------- | --------------------------------------------- |
| Unauthenticated request to `/`                 | Redirect to `/login?next=%2F`                 |
| Authenticated with zero RLS-visible businesses | Redirect protected routes to `/onboarding`    |
| Authenticated with one or more businesses      | Allow `/`; redirect auth/onboarding pages `/` |

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
   `memberships.manage`, `permissions.manage`, `modules.manage`, and `audit.view`;
4. a `business.created` audit event.

No modules are enabled. The function accepts neither another user ID nor permission keys. Its exact
retry behavior, duplicate-slug rollback, unauthenticated execution, ownership, permission bundle,
audit event, and tenant isolation are verified with pgTAP.

## Application authorization helpers

Small server-only helpers resolve the current claims, list all RLS-visible businesses, list active
memberships, resolve an explicit business UUID/slug from the authorized list, and ask database RPCs
for permission or super-admin decisions. Helpers fail closed and do not reproduce database policy
logic in TypeScript.

Multi-business access is supported by returning the complete authorized list. A polished switcher
and durable current-business route/session representation are intentionally deferred; future work
must keep tenant selection explicit and server-authorized.

## Environment boundaries

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are browser-visible and rely
  on RLS;
- `SUPABASE_SECRET_KEY` is server-only and is not read by the admin application;
- the secret key is used by local Playwright setup only to create an isolated auth test user and is
  injected from local Supabase status rather than committed;
- cleanup uses the local Postgres connection, refuses non-local hosts, and removes only the generated
  user, business, and audit fixture without weakening production audit grants.

## Deferred auth work

- account registration and email verification UX;
- password reset and account recovery;
- invitations and acceptance;
- OAuth, magic links, and MFA;
- super-admin UI and operational provisioning;
- detailed session-duration/device management;
- durable current-business selection and the full admin dashboard.
