# Core database

Status: core tenancy, capability, appearance, media, custom-domain, business-locale, and Restaurant
Engine domain foundations are implemented through deterministic Supabase migrations. Remote
application is environment-specific and must be verified with `supabase migration list`.

## Schema boundaries

- `core` is the RLS-protected Data API schema for platform and tenant data.
- `restaurant` is the RLS-protected Restaurant Engine schema; it has no anonymous public-read policy.
- `public` contains the narrowly granted anonymous Restaurant projection, not tenant tables.
- `private` is not exposed through the Data API. It owns authorization helpers and super-admin
  assignments.
- `auth.users` remains the source of authentication identity. Darb does not duplicate auth-owned
  credentials or email fields.

The local Supabase configuration exposes `core`, `restaurant`, `public`, and `graphql_public`; it
does not expose `private`. A future remote deployment must explicitly add the application schemas
to the hosted project's exposed-schema allowlist before clients can address them.

## Tables

| Table                             | Responsibility                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `core.profiles`                   | Minimal display identity and optional locale preference linked 1:1 to `auth.users` |
| `core.businesses`                 | Canonical tenant identity, lifecycle, locale, ISO currency, and IANA timezone      |
| `core.locations`                  | Reusable business locations with minimal postal fields and no engine-specific data |
| `core.memberships`                | Unique user-to-business relationship with active or suspended lifecycle            |
| `core.modules`                    | Platform-owned capability key, label, description, availability, and order         |
| `core.permissions`                | Stable permission-key registry and allowed assignment scope                        |
| `core.membership_permissions`     | Normalized business-wide or location-scoped permission assignments                 |
| `core.business_modules`           | Data-driven module enablement per business, independent of billing                 |
| `core.templates`                  | Platform-owned template compositions and validated default semantic themes         |
| `core.business_visual_settings`   | Tenant template selection and partial theme overrides per module context           |
| `core.media_assets`               | Shared business media metadata and immutable Storage object identity               |
| `core.module_media_roles`         | Platform-owned module branding-role registry and allowed media kinds               |
| `core.business_media_assignments` | Tenant branding-role assignment to a canonical shared media asset                  |
| `core.business_domains`           | Retained ownership claims plus explicit engine-target routing lifecycle            |
| `core.business_locales`           | Per-business enabled locale set; business default remains canonical                |
| `core.audit_events`               | Append-oriented sensitive-operation event foundation                               |
| `private.super_admins`            | Revocable platform-wide administrators, separate from tenant access                |

Internal identifiers are UUIDs and slugs remain human-readable identifiers. All stored timestamps
use `timestamptz`; business defaults are ILS and `Asia/Jerusalem`, while no naive local timestamp or
floating-point money field exists. Composite foreign keys keep permission membership and location
scope inside the declared business.

The 15 Restaurant tenant tables cover configuration, multiple menus, categories, items, variants,
reusable modifier groups/options, item assignments, location availability overrides, and six
relational translation tables. Their exact responsibilities and ownership constraints are
documented in [`RESTAURANT.md`](./RESTAURANT.md).

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

Phase 7 extends the snapshot with `can_manage_appearance` and adds
`core.set_business_appearance(...)` plus `core.reset_business_theme_overrides(...)`. Both require
business-wide `appearance.manage`, an active tenant, an effectively enabled module, and a template
from that module. Postgres validates the closed JSON token shape and resolved critical contrast.
Template/theme changes and resets are atomic, idempotent, and audited only when state actually
changes. Suspended and archived tenants must be active before appearance mutation.

Phase 9 adds an authenticated `restaurant.*` mutation API for configuration, menu structure,
localized content, variants, reusable modifiers, assignments, and location availability. Direct
authenticated writes are withheld. Every function requires business-wide `restaurant.manage`, an
active business, and an enabled and available Restaurant module; it resolves parents within the
target tenant and writes allowlisted audit metadata atomically. Unchanged requests are explicit
no-ops. The API uses no dynamic SQL or generic JSON command.

Phase 11 adds `public.get_restaurant_publication(requested_business_slug)`. This stable,
security-definer read boundary returns one curated JSON projection and `null` when tenant,
capability, lifecycle, configuration, publication, or template gates fail. It is the only anonymous
function exposing Restaurant content: direct table reads remain denied. The migration also
registers the platform-owned `restaurant-signature` default template; it creates no tenant
appearance or content.

Phase 12 separates domain ownership from deployment routing. `core.business_domains` stores a
nullable canonical module target and a closed routing lifecycle; legacy claims remain unassigned.
Normal authenticated RPCs set a verified claim's target, begin provisioning, disconnect routing,
and select a primary only after live attestation. `core.record_business_domain_routing_attestation`
is service-only and rechecks the initiating user's authorization and all tenant/capability gates.
`public.resolve_public_domain(hostname)` exposes the minimal exact-host Restaurant route, while
`public.resolve_public_restaurant_primary_domain(slug)` provides canonical-origin selection. Both
fail closed without exposing tenant IDs, ownership proof, or provider state.

Phase 13 adds `public.list_public_restaurant_sitemap()`. This separate anonymous-safe discovery
projection returns only canonical business slug, default locale, enabled locale array, and optional
trusted primary hostname for publicly effective Restaurants with published content. It uses an
empty `search_path`, a narrow execute grant, and no anonymous raw-table grant.

Phase 14 adds authenticated, super-admin-only control-plane projections:

- `core.get_platform_overview()`;
- `core.list_platform_businesses(...)` and `core.get_platform_business_detail(...)`;
- `core.list_platform_users(...)` and `core.list_platform_super_admins()`;
- `core.list_platform_modules()` and `core.list_platform_templates()`;
- `core.list_platform_domains(...)`;
- `core.list_platform_audit_events(...)`.

The list functions bound page size and execute filtering/pagination in Postgres. Auth fields,
domain proof/provider details, theme documents, and audit metadata are deliberately absent. The
same migration adds `core.set_platform_business_status(...)`, an authenticated super-admin-only,
row-locking lifecycle transition that derives its actor and writes one redacted audit event in the
same transaction. All functions revoke `public`, `anon`, and service-role execution and grant only
`authenticated`; each still checks `private.is_super_admin()` internally.

The Restaurant branding-media migration adds
`core.set_business_media_assignment(business_id, module_key, role_key, media_asset_id)`. The
authenticated function derives its actor, requires `appearance.manage`, active tenant lifecycle,
effective module state, a governed available role, and an active same-business compatible asset.
Passing `null` removes the assignment. Repeated assign/remove requests return `changed = false` and
emit no audit event. A private validation trigger repeats the role, kind, lifecycle, and tenant
checks for every trusted table writer. The Restaurant public projection composes these assignments
onto its existing customer-safe graph without granting anonymous table access.

Restaurant Admin name-bearing writes now call six `restaurant.save_localized_*` wrappers. These
preserve the original permission, lifecycle, module, ownership, validation, and audit boundaries,
then create a missing business-default-locale translation in the same transaction. The private
insert-only helper cannot overwrite an explicit public translation and has no client execute
grant. A one-time forward data repair covers existing active records already marked for public
delivery; draft, hidden, and archived records remain untouched.

Domain ownership and routing attestation are the only service-only application RPCs. They accept
minimal evidence from trusted DNS or deployment-provider runtime, recheck that the initiating user
still holds `domains.manage` (or explicit platform super-admin status), and record only reviewed
outcomes. Normal and anonymous clients cannot execute them; tokens and provider payloads are never
accepted or audited.

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

Direct authenticated writes to `core.templates` and `core.business_visual_settings` are withheld.
Templates are platform reference data; visual settings are tenant-readable through active
membership RLS and writable only through the audited authenticated RPCs. The service role retains
technical access but is not used by ordinary appearance flows.

Direct authenticated writes to `core.module_media_roles` and
`core.business_media_assignments` are also withheld. Authenticated users may read the governed role
registry and their RLS-visible tenant assignments; ordinary writes cross only the audited assignment
RPC. Anonymous users receive neither table and see only active render-safe assignments nested in the
existing Restaurant publication projection.

Direct authenticated Restaurant writes are withheld across all 15 tables. RLS reads require
`restaurant.read` or `restaurant.manage`, including explicit super-admin authorization through the
existing helper. Anonymous access is absent. Disabled/unavailable module state and non-active
business lifecycle retain data for authorized historical reads but block every mutation.
The anonymous role still has no Restaurant schema/table access; it can execute only the curated
public projection, whose output omits internal names, audit fields, actors, and administration
metadata.

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
enable a module for any business or seed tenant content. An absent
`core.business_modules` row means disabled; first-business bootstrap continues to create zero rows.

The migration also registers two generic, platform-owned `pages` composition foundations to prove
template resolution. They seed no tenant row or business content and create no pages engine. An
absent `core.business_visual_settings` row resolves to the available module default.

## Types and client boundaries

`packages/database/src/database.types.ts` is generated from the local `core`, `public`, and
`restaurant` schemas:

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
Phase 7 coverage adds platform-registry immutability, cross-tenant visual-state isolation, exact
`appearance.manage` enforcement, enabled-module/template-context checks, JSON/CSS injection
rejection, critical contrast enforcement, lifecycle denial, idempotent save/reset behavior,
redacted audits, and narrow owner-bundle evolution.
Phase 9 adds 124 assertions for Restaurant schema/grants/RLS, safe money and selection bounds,
multiple-menu structure, tenant-aware media/location/parent relationships, localization,
permission backfill isolation, lifecycle and module gates, mutation idempotency, audit redaction,
transactional failure, anonymous denial, and retained-data semantics.
Phase 11 adds curated-publication coverage. Phase 12 adds exact-host routing, conservative legacy
state, target/module/lifecycle gates, cross-tenant and anonymous denial, service-only attestation,
primary-host invariants, immediate disconnect revocation, and redacted domain audit assertions.
Phase 13 adds discovery grant, definer/search-path, lifecycle/module/publication eligibility,
locale, canonical-host, and raw-table-denial coverage. Restaurant branding media adds 37 assertions
for governed-role grants, direct-write denial, assignment idempotency, lifecycle/module/permission
gates, tenant-safe media relationships, redacted audits, and public fallback behavior. The full
suite contains 618 assertions, including default-locale publication synchronization, wrapper
grants/search paths, public projection delivery, and explicit-translation preservation.

## Intentionally deferred

- general additional-business workflows and membership invitations;
- role templates and additional engine-specific permission catalogues;
- member, permission, platform-module-registry, and super-admin administration;
- module dependencies, engine-specific configuration beyond Restaurant, and billing entitlements;
- location restoration and hard-deletion workflows;
- public rendering for engines beyond Restaurant;
- comprehensive audit retention and export policy;
- physical media deletion and transformations;
- wildcard domains, provider webhooks, background reconciliation, and DNS automation;
- translation management and other engine-localized content tables;
- billing and remote deployment.
