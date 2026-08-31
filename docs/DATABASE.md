# Core database

Status: Phase 2 core tenancy foundation implemented locally through deterministic Supabase
migrations. No remote migration has been performed.

## Schema boundaries

- `core` is the RLS-protected Data API schema for platform and tenant data.
- `private` is not exposed through the Data API. It owns authorization helpers and super-admin
  assignments.
- `auth.users` remains the source of authentication identity. Darb does not duplicate auth-owned
  credentials or email fields.

The local Supabase configuration exposes `core`, `public`, and `graphql_public`; it does not expose
`private`. A future remote deployment must explicitly add `core` to the hosted project's exposed
schemas before clients can address it.

## Tables

| Table                         | Responsibility                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `core.profiles`               | Minimal display identity and optional locale preference linked 1:1 to `auth.users` |
| `core.businesses`             | Canonical tenant identity, lifecycle, locale, ISO currency, and IANA timezone      |
| `core.locations`              | Reusable business locations with minimal postal fields and no engine-specific data |
| `core.memberships`            | Unique user-to-business relationship with active or suspended lifecycle            |
| `core.modules`                | Stable platform module registry                                                    |
| `core.permissions`            | Stable permission-key registry and allowed assignment scope                        |
| `core.membership_permissions` | Normalized business-wide or location-scoped permission assignments                 |
| `core.business_modules`       | Data-driven module enablement per business, independent of billing                 |
| `core.audit_events`           | Append-oriented sensitive-operation event foundation                               |
| `private.super_admins`        | Revocable platform-wide administrators, separate from tenant access                |

Internal identifiers are UUIDs and slugs remain human-readable identifiers. All stored timestamps
use `timestamptz`; business defaults are ILS and `Asia/Jerusalem`, while no naive local timestamp or
floating-point money field exists. Composite foreign keys keep permission membership and location
scope inside the declared business.

## Database utilities and authorization helpers

`private.set_updated_at()` maintains mutable-row timestamps. `private.create_profile_for_auth_user()`
creates only an identity row after an `auth.users` insert. `private.validate_membership_permission_scope()`
rejects location assignments for business-only permissions.

RLS policies call four stable, security-definer helpers:

- `private.is_super_admin()` checks an active platform assignment;
- `private.has_active_membership(business_id)` resolves tenant visibility;
- `private.has_permission(business_id, permission_key, location_id)` resolves business-wide or exact
  location scope;
- `private.can_grant_permission(...)` requires the grantor to hold both delegation authority and the
  permission being delegated at the requested scope.

These functions contain no dynamic SQL, use explicit schema qualification and an empty
`search_path`, and expose execution only to `authenticated`. They read base tables as their owner so
policies do not recursively query themselves through RLS.

## RLS and grants

RLS is enabled on every table listed above. Authenticated reads and mutations require active
membership, the relevant permission, or explicit super-admin status as appropriate. Location reads
and writes evaluate the requested location ID so business-wide and exact-location grants have clear
semantics. Anonymous roles have no schema or table grants.

Authenticated permission changes use `can_grant_permission`, preventing a user from delegating an
authority or scope they do not already possess. The authenticated role cannot create businesses,
write audit events, edit reference registries, or access super-admin rows. Those operations require
future reviewed server workflows.

The service role retains its expected technical RLS bypass for trusted server operations, but its
grant cannot update, delete, or truncate audit events. It is not equivalent to a row in
`private.super_admins`.

## Platform reference data

Migrations deterministically register the future module identifiers `restaurant`, `booking`,
`pages`, and `commerce`, plus the minimal permissions needed by the core model. These rows define
platform vocabulary only. They do not enable a module for any business, create engine tables, or
seed tenant content.

## Types and client boundaries

`packages/database/src/database.types.ts` is generated from the local `core` and `public` schemas:

```bash
pnpm db:types
```

The `private` schema is intentionally excluded. `@darb/database` exposes separate browser, SSR
server, privileged server-only, and types entry points. Client factories take validated
configuration rather than reading environment variables implicitly, keeping deployment wiring in
the owning application.

## Local verification

```bash
pnpm supabase:start
pnpm db:reset
pnpm db:lint
pnpm db:test
pnpm db:types
```

Database tests use pgTAP against Postgres roles and JWT subjects, not application mocks. Fixtures are
created inside transactions and rolled back. They cover schema/RLS presence, authorized tenant
access, cross-tenant denial, location scope, mutation denial, anonymous denial, module and audit
isolation, permission escalation denial, and super-admin boundaries.

## Intentionally deferred

- business onboarding and membership invitations;
- role templates and engine-specific permission catalogues;
- authentication and administration UI;
- engine-owned tables and runtime behavior;
- audit emission workflows and retention policy;
- billing, custom domains, storage policy, and remote deployment.
