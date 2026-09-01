# Core database

Status: core tenancy, capability, media, custom-domain, and business-locale foundations are
implemented through deterministic Supabase migrations. Remote application is environment-specific
and must be verified with `supabase migration list`.

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
| `core.modules`                | Platform-owned capability key, label, description, availability, and order         |
| `core.permissions`            | Stable permission-key registry and allowed assignment scope                        |
| `core.membership_permissions` | Normalized business-wide or location-scoped permission assignments                 |
| `core.business_modules`       | Data-driven module enablement per business, independent of billing                 |
| `core.media_assets`           | Shared business media metadata and immutable Storage object identity               |
| `core.business_domains`       | Retained, globally unique DNS-verified custom-domain claims                        |
| `core.business_locales`       | Per-business enabled locale set; business default remains canonical                |
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

Three authenticated application functions are exposed through `core`:

- `core.current_user_is_super_admin()` returns only the caller's platform-admin decision;
- `core.current_user_has_permission(business_id, permission_key, location_id)` exposes the existing
  database permission decision without reproducing SQL logic in TypeScript;
- `core.bootstrap_first_business(display_name, slug, locale)` atomically creates the caller's first
  active tenant relationship.

The bootstrap function validates and normalizes its inputs, derives identity from `auth.uid()`, and
locks the caller's `auth.users` row to serialize concurrent attempts. It inserts one business, one
active membership, the exact foundation permission bundle, and one `business.created` audit event.
It enables no business modules. An exact retry is idempotent; a different request is rejected while
an active membership exists. The function has an empty `search_path`, fully qualified references,
no dynamic SQL, and execution granted only to `authenticated`.

Phase 4 adds one read helper and four narrow mutation boundaries:

- `core.current_user_business_access(business_id)` returns a single caller-specific snapshot for
  business settings, business-wide location access, audit visibility, and super-admin awareness;
- `core.update_business_settings(...)` validates core identity/regional fields, enforces
  `business.manage`, protects the `suspended` state, and emits `business.updated`;
- `core.create_location(...)` requires business-wide `locations.manage`, validates reusable core
  fields, and emits `location.created`;
- `core.update_location(...)` accepts business-wide or exact location-scoped `locations.manage`,
  keeps archived rows read-only, and emits `location.updated`;
- `core.archive_location(business_id, location_id)` uses the same location-aware permission check,
  performs an idempotent soft archive, and emits `location.archived`.

Phase 5 extends the access snapshot with `can_manage_modules` and adds
`core.set_business_module_enabled(business_id, module_key, enabled)`. The mutation requires
business-wide `modules.manage`, accepts only a canonical registry key and requested boolean state,
locks the business, and changes capability state plus its audit event atomically. Repeated requests
return `changed = false` and emit no audit event. New enablement is blocked for unavailable modules;
tenant admins cannot mutate suspended or archived businesses, explicit super admins may handle
suspended businesses, and archived businesses must be reactivated first.

Phase 6 extends the snapshot with `can_manage_media` and `can_manage_domains`. It adds narrow
authenticated media RPCs for reservation, Storage completion, alt-text updates, and archive;
domain RPCs for add, verification restart, primary selection, and disable; and one atomic
`business.manage` locale-set mutation. Media/domain mutation functions require their dedicated
business-wide permission and an active business. All retain state instead of hard-deleting.

`core.record_business_domain_verification(domain_id, requesting_user_id, succeeded)` is the sole
service-only application RPC. It accepts evidence only from trusted server runtime after Node DNS
resolution, rechecks that the initiating user still holds `domains.manage` (or explicit platform
super-admin status), and records only the boolean outcome. It cannot be executed by normal or
anonymous clients and no token is accepted or audited.

`private.is_valid_timezone(text)` checks submitted values against Postgres' IANA timezone catalog.
Ordinary tenant mutation functions derive the actor with `auth.uid()`, fully qualify objects, use an
empty `search_path`, and write the mutation plus allowlisted audit metadata in one transaction.
Execute is granted only to `authenticated`; the DNS attestation exception above is service-only and
does not perform ordinary tenant management.

## RLS and grants

RLS is enabled on every table listed above. Authenticated reads and mutations require active
membership, the relevant permission, or explicit super-admin status as appropriate. Location reads
and writes evaluate the requested location ID so business-wide and exact-location grants have clear
semantics. Anonymous roles have no schema or table grants.

Authenticated permission changes use `can_grant_permission`, preventing a user from delegating an
authority or scope they do not already possess. The authenticated role cannot directly create
businesses, write audit events, edit reference registries, or access super-admin rows.
First-business creation is the narrow reviewed RPC exception; general business creation remains
deferred.

Authenticated direct inserts and updates on `core.business_modules` are revoked; the narrow audited
function is the ordinary tenant write path. The service role retains its expected technical RLS
bypass for trusted server operations, but its
grant cannot update, delete, or truncate audit events. It is not equivalent to a row in
`private.super_admins`.

Direct authenticated writes to Phase 6 core tables are also withheld. Active members may read only
their tenant rows through RLS. Media, domain, and locale transitions go through reviewed RPCs;
anonymous access is denied.

Storage uses the shared public-read buckets `tenant-media-images` and `tenant-media-videos`. Their
10 MiB and 100 MiB bucket limits and MIME allowlists are version-controlled. Authenticated insert
policy requires an exact pending `core.media_assets` reservation, matching derived bucket/path,
reservation owner, and current `media.manage`; there is no normal update/delete policy. Completion
checks the final object owner, MIME, and byte size before activating metadata. Public reads are a
delivery decision, not a write grant.

## Platform reference data

Migrations deterministically register the module identifiers `restaurant`, `booking`, `pages`, and
`commerce`, with platform labels, descriptions, availability, and sort order, plus the minimal
permissions needed by the core model. These rows define platform vocabulary only. They do not
enable a module for any business, create engine tables, or seed tenant content. An absent
`core.business_modules` row means disabled; first-business bootstrap continues to create zero rows.

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
isolation, permission escalation denial, and super-admin boundaries. Bootstrap coverage additionally
proves authentication, caller ownership, the exact permission bundle, signature safety, atomic slug
conflict handling, audit emission, exact retry behavior, suspended-membership semantics, and
post-bootstrap tenant isolation. Core administration coverage proves permission-gated business
updates, cross-tenant denial, lifecycle restrictions, super-admin suspension, business-wide create,
location-scoped read/update/archive behavior, anonymous denial, and exact audit events.
Module coverage proves audited enable/disable, no-op idempotency, unique state, direct-write denial,
cross-tenant and location-scope isolation, unavailable-key rejection, lifecycle restrictions,
anonymous denial, and explicit super-admin behavior.
Phase 6 coverage adds kind-specific Storage configuration and ownership, immutable paths, MIME/size
validation, permission and cross-tenant denial, archive retention, domain normalization and global
uniqueness, DNS attestation/retry/lifecycle, primary-domain invariants, locale default/enablement
invariants, owner-bundle evolution, anonymous denial, and redacted audit events.

## Intentionally deferred

- general additional-business workflows and membership invitations;
- role templates and engine-specific permission catalogues;
- member, permission, platform-module-registry, and super-admin administration;
- module dependencies, engine-specific configuration, and billing entitlements;
- location restoration and hard-deletion workflows;
- engine-owned tables and runtime behavior;
- comprehensive audit retention and export policy;
- physical media deletion and transformations;
- production custom-domain routing/provider automation;
- engine-localized content tables;
- billing and remote deployment.
