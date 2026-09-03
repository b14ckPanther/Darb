# Security principles

Status: RLS-first database authorization, server-resolved Supabase sessions, protected admin
routing, a narrow first-business trust boundary, and a controlled Restaurant domain mutation
boundary are implemented. Controls tied to future business workflows remain deferred.

## Data access

Supabase security is RLS-first. Every `core` and `restaurant` tenant table plus
`private.super_admins` has Row Level Security enabled with explicit policies. Database policy is the final data boundary; future API handlers and
server actions must also authorize requests server-side to provide clear failures and defense in
depth.

Table grants are opt-in and column-limited for authenticated mutations. Anonymous users receive no
Restaurant administration access and no access to `core` or `private`. The `private` schema is not exposed through the Data API. Its small
security-definer helper set uses schema-qualified objects, an empty `search_path`, no dynamic SQL,
and narrowly granted execution to avoid recursive RLS policies and search-path substitution.

Use least privilege for users, services, CI, deployments, and operators. Hiding a control in the UI
does not authorize or protect its underlying action. Elevated access must be narrow, intentional,
and kept out of browser code.

## Secrets and environments

- Never commit API keys, tokens, passwords, database URLs containing credentials, or signing keys.
- Browser code may use only the Supabase publishable key and still relies on correct RLS.
- Supabase secret keys and legacy service-role keys are server-only because they bypass RLS.
- Keep local, preview, and production values in their respective secret managers or ignored local
  files.
- Treat logs, fixtures, screenshots, and error reports as possible secret-exposure paths.

The project reference `xtuhwpyqxgmsthgumktk` is a non-secret identifier. Its presence does not grant
database access.

Public Supabase configuration is accepted only as a credential-free HTTP(S) origin and publishable
key. Admin-only provider and Supabase secrets are validated at the trusted operation boundary and
use the `DARB_*` namespace where app-owned. Main and Restaurant do not read them. Repository tests
retain the rejected legacy Vercel names solely as negative regression fixtures.

## Privileged boundaries

`private.super_admins` holds explicit, revocable platform authorization and is separate from tenant
membership. Normal clients cannot read or mutate it. A Supabase secret or legacy service-role key
bypasses RLS as a technical capability; it does not create a super-admin product identity and must
be limited to audited, trusted server paths.

`@darb/database/browser` and `@darb/database/server` accept publishable keys. The privileged factory
is a separate `server-only` export, disables session persistence and refresh behavior, and requires
its secret explicitly. The admin app uses it only after server-side DNS or deployment-provider
checks to call the service-only domain attestation RPCs. Ordinary tenant reads, writes, media
uploads, and permission checks never use it.

## Application boundaries

Validate and normalize every external input at a trusted boundary. Encode output for its context,
use parameterized data access, and avoid exposing internal errors. Authentication establishes user
identity; authorization must separately prove tenant, location, resource, and action access.

The admin app creates a new Supabase SSR client for each Server Component request or Server Action.
Next.js Proxy refreshes auth cookies through `getClaims()` but performs no tenant authorization;
protected pages repeat authenticated identity and RLS-visible business resolution close to the
route. Server Actions write response cookies and database RLS remains authoritative.

The current tenant is an explicit `/b/[businessSlug]` route segment. Server Components resolve it
only from the caller's RLS-visible list; Server Actions independently resolve the submitted business
UUID through that same boundary. Location detail reads additionally constrain both `business_id`
and `location_id`. Unauthorized tenant or resource routes fail closed without revealing whether an
unavailable identifier exists.

The admin navigation registry is filtered from the server-resolved permission and effective-module
snapshot to avoid misleading UI, but it is never an authorization boundary. Direct routes and
mutations retain their existing server/database checks. The Overview uses only ordinary
request-scoped, RLS-visible reads and stores no dashboard or activity state.

`/platform/*` adds a distinct super-admin route boundary. Both the layout and each data loader
require the database-backed super-admin decision before a platform projection is attempted, so a
concurrently rendered child cannot race the parent redirect. Platform RPCs repeat the active
`private.super_admins` check, expose execution only to `authenticated`, and project allow-listed
fields rather than granting raw browser access to `auth`, `private`, or tenant tables. The Auth user
projection omits hashes, sessions, identities, providers, and metadata; domains omit verification
proof and provider payloads; platform audit omits event metadata.

Return paths are accepted only as same-origin relative paths. Sign-in errors remain generic to avoid
account enumeration. Sign-out is local to the current session. The app never uses the privileged
client for ordinary auth, tenant reads, permission checks, or onboarding.

Dependency updates, framework configuration, redirects, uploads, webhooks, and future integrations
require security review proportional to their risk.

## HTTP, host, and error hardening

All applications share a restrictive CSP/header builder, while each application supplies only its
actual resource origins and indexing policy. Frames and objects are denied; referrer, content-type,
permissions, and platform HSTS policy are explicit. Restaurant omits response-owned HSTS because
the deployment also serves tenant domains. Inline script/style support is a documented Next.js and
theme-runtime constraint; production never enables `unsafe-eval`.

The public proxy normalizes IDNs to ASCII, rejects IP/localhost production hosts, Darb-reserved
hosts, malformed/multi-value input, and any conflict between `Host` and forwarded host. It removes
forged internal-route headers and rejects direct internal routes. Neither canonical URLs nor
sitemaps trust request hosts without exact database resolution. Request-scoped React memoization
does not create a cross-tenant cache.

Structured logging allowlists low-cardinality context and normalized public identifiers. Original
errors, headers, cookies, tokens, credentials, request/publication payloads, and provider response
bodies are never serialized. Error boundaries expose only safe recovery language. See
[`PRODUCTION.md`](./PRODUCTION.md) for the exact policy and environment ownership.

## Audit foundation

`core.audit_events` is append-oriented and records actor kind, optional authenticated actor,
optional business scope, action key, optional entity reference, metadata, and `timestamptz`. Normal
authenticated clients can only read authorized business events with `audit.view`; they cannot write
events. Trusted service paths can append but cannot update, delete, or truncate through the
service-role grant. Application workflows must define redaction and metadata allowlists before
emitting sensitive values.

The first concrete event is `business.created`, emitted atomically by the database bootstrap
function with the authenticated caller and new tenant identity. Its fixed metadata contains only
the bootstrap source marker.

Core administration now emits `business.updated`, `location.created`, `location.updated`, and
`location.archived`. Each event is written in the same database transaction as its mutation. The
database derives the actor from `auth.uid()` and accepts no actor ID from the client. Update metadata
contains an allowlisted array of changed field names; create/archive metadata contains only a fixed
source marker or the prior lifecycle status, never raw form payloads or address values.

Capability transitions emit `business.module_enabled` or `business.module_disabled` only for an
actual state change. Metadata is limited to the canonical module key and previous/new booleans.
No-op requests create neither duplicate state nor duplicate audit history.

Appearance transitions emit `business.template_changed`, `business.theme_updated`, or
`business.theme_reset` only for actual changes. Metadata contains module/template identifiers and
changed semantic token paths, never the full override document or arbitrary CSS.

Shared media transitions emit `business.media_registered`, `business.media_updated`, and
`business.media_archived`. Domain transitions emit added, verification outcome/restart, primary,
and disabled events. Locale changes emit `business.locales_updated`. Metadata is allowlisted and
never includes media payloads, raw forms, or DNS verification tokens.

Restaurant mutations emit stable `restaurant.*` events for meaningful configuration, content,
translation, modifier-assignment, and location-availability changes. They are atomic with the
mutation and derive the actor from `auth.uid()`. Metadata excludes customer-facing names,
descriptions, prices, media paths, and full payloads; no-op requests emit no event.

Platform business lifecycle changes emit `platform.business_suspended`,
`platform.business_archived`, or `platform.business_reactivated` in the same transaction as the
status update. The authenticated actor is derived from `auth.uid()`, metadata contains only previous
and new lifecycle state, and a no-op produces no event.

## Core mutation boundaries

Business and location Server Actions use the normal request-scoped authenticated client and never
the privileged factory. Typed parsers normalize and validate form input, application helpers provide
fail-closed UX decisions, and the database RPC repeats the authoritative permission check. The
security-definer functions use empty `search_path`, schema-qualified references, no dynamic SQL,
`auth.uid()` identity, narrow authenticated execution grants, and an atomic audit insert.

Only platform super admins may set or clear `suspended`. Location creation requires a business-wide
`locations.manage` assignment; an exact location-scoped assignment can update or archive only that
location. Archived locations cannot be changed by the update function. Anonymous execution and
service-role execution of these public RPCs are explicitly revoked.

Normal capability management uses the same request-scoped authenticated client. Direct tenant
writes to `core.business_modules` are revoked, and `core.set_business_module_enabled` repeats the
`modules.manage`, registry availability, and business lifecycle checks in Postgres. The caller
cannot provide an actor, create a registry definition, attach metadata, or cross tenants. Module
enablement is a business capability decision and is never treated as user authorization.

Appearance management also uses the request-scoped authenticated client. Direct writes to the
platform template registry and tenant visual settings are revoked. The RPC derives `auth.uid()`,
requires business-wide `appearance.manage`, rechecks active tenant and enabled-module state,
validates template context, accepts only a closed semantic JSON contract, and rejects critical
contrast failure. URL/CSS/script-shaped values cannot enter the persisted theme model.

Restaurant branding assignments reuse this permission but cross a separate audited media RPC.
Tenants cannot write the platform role registry or assignment table directly. The RPC derives the
actor, resolves an available role, locks the active business, requires an effectively enabled
module, and accepts only an active role-compatible asset owned by that business. Tenant-aware
foreign keys plus a private validation trigger prevent cross-business or incompatible assignment
even for trusted writers. Anonymous callers cannot read assignment tables; the existing Restaurant
publication function exposes only active customer-safe media fields and no filename, actor, or
audit metadata.

Restaurant administration uses the normal request-scoped authenticated client. Its Server Actions
re-resolve the RLS-visible business, active lifecycle, module state, and Restaurant permission
before calling the existing narrow RPCs; direct table writes remain withheld. Those RPCs require
`restaurant.manage`, active tenant lifecycle, and an enabled/available Restaurant module, then
re-resolve every parent inside the target business. Composite foreign keys prevent cross-tenant
menu/category/item, media, modifier, translation, and location relationships even for trusted SQL.
Anonymous and service-role execution of tenant mutation RPCs is revoked. Public Restaurant delivery
uses only `public.get_restaurant_publication(text)`, a separate stable security-definer function
with an empty `search_path`, fully qualified reads, no dynamic SQL, and a narrow execute grant. It
returns `null` unless all lifecycle/module/configuration/publication/template gates pass and exposes
only a reviewed render-safe projection. Administration tables remain anonymously unreadable; the
public application uses a stateless publishable-key client and has no privileged client. Public
discovery is a separate narrow function returning only eligible slugs, locales, and trusted primary
hostnames; it does not broaden raw table grants.

## Storage and DNS boundaries

Media upload is a three-step, fail-closed flow: an authenticated RPC reserves a UUID-derived bucket
and path, the browser uploads directly with the same session through Storage RLS, and an
authenticated completion RPC validates the stored owner, MIME, and byte size before activation.
Image and video buckets carry separate MIME allowlists and 10 MiB/100 MiB limits. There is no tenant
overwrite or delete policy; archive changes metadata and controlled physical cleanup remains
deferred. Public-read bucket delivery is intentional for future high-volume storefront media and
does not weaken metadata or write authorization.

Domain verification never performs an HTTP ownership fetch. Server-only Node DNS resolves one exact
TXT name with a timeout and distinguishes NXDOMAIN/no data from transient failures. Only the boolean
result reaches a service-key RPC, which rechecks the initiating authenticated user's current
`domains.manage` assignment and business lifecycle. The service key is an evidence-transport
boundary, not tenant authorization; token values never enter logs or audit metadata.

Deployment routing is a separate attestation boundary. The server-only provider adapter attaches or
inspects an exact hostname and forwards only a reviewed `live` or `failed` outcome to Postgres.
Postgres rechecks the initiating user's current permission, verified ownership, target capability,
module availability, and active business before accepting it. Provider tokens and raw payloads
never enter the database or browser-visible error state; a curated list of provider-recommended DNS
records may be returned as operator guidance. Disconnect revokes database routing before
best-effort provider cleanup.

The public host resolver is an exact-match, anonymous-safe projection. It returns no business UUID,
ownership token, provider state, or admin metadata and only resolves verified, live Restaurant
targets for active businesses with an effective capability. Next.js Proxy rejects malformed,
multi-valued, conflicting-forwarded, IP/local production, internal, and reserved Darb hosts before
the internal rewrite. Restaurant publication gates are independently rechecked by the Phase 11
projection; raw `core` and `restaurant` tables remain unavailable anonymously.

## Bootstrap security

`core.bootstrap_first_business` is a narrowly granted `security definer` function. It uses an empty
`search_path`, schema-qualified objects, no dynamic SQL, and `auth.uid()` rather than caller-supplied
identity. It validates display name, slug, and locale in Postgres; accepts no permission list or
target user; assigns a fixed twelve-permission bundle; and executes only for `authenticated`.
Unauthenticated, cross-user, arbitrary-permission, duplicate-slug, concurrency, and tenant-isolation
behavior is covered at the database layer.

## Controls added with future workflows

Sensitive public flows will be rate-limited and abuse-aware when those endpoints exist. Sensitive
administrative operations will use the audit-event foundation when their server workflows are
implemented. Password reset, sign-up, invitations, OAuth, magic links, MFA, session-duration policy,
content-security policy, audit retention, recovery, monitoring, and incident
response remain deferred until their concrete surfaces exist.

## Verification

Security-relevant changes must include tests for denied access, not only successful paths. Current
pgTAP coverage changes session roles and JWT subjects to exercise RLS for tenant users, a super
admin, and anonymous access. It verifies cross-business denial, location scope, mutation denial,
permission self-escalation denial, super-admin self-promotion denial, audit and module isolation,
plus unauthenticated and adversarial first-business bootstrap cases. Phase 4 coverage additionally
proves business lifecycle restrictions, cross-tenant mutation denial, business-wide versus exact
location scope, append-only audit emission, anonymous denial, and explicit super-admin behavior.
Phase 5 adds module permission/scope denial, unavailable and unknown key rejection, audited
idempotency, direct-write denial, suspended/archived business rules, and cross-tenant state tests.
Phase 6 adds Storage reservation/path/bucket denial, media lifecycle, global hostname uniqueness,
reserved-host denial, DNS attestation/retry/lifecycle, domain primary invariants, locale invariants,
owner-bundle backfill isolation, and Phase 6 audit redaction.
Phase 7 adds registry/direct-write denial, exact appearance permission and tenant isolation,
enabled-module/template constraints, arbitrary token/CSS rejection, contrast enforcement,
suspended/archived denial, audited idempotency, and narrow owner-bundle backfill isolation.
Phase 9 adds Restaurant RLS/grant checks, tenant-aware foreign-key attacks, money and selection
constraints, localization ownership, read/manage separation, partial-membership backfill isolation,
module/lifecycle denial, audited idempotency, transactional failure, and anonymous denial.
Phase 11 proves the curated public Restaurant projection exposes only published render-safe state.
Phase 12 adds exact-host resolution, verified/live/capability/lifecycle fail-closed gates,
permission and cross-tenant denial, service-only routing attestation, idempotent disconnect,
primary-domain invariants, and credential-free audit coverage.
Restaurant branding-media coverage adds governed-role grants, direct-write denial, exact
`appearance.manage` enforcement, incompatible and inactive-asset denial, cross-tenant rejection,
idempotent assignment/removal, redacted audits, lifecycle/module gates, and customer-safe projection
fallbacks.
Database fixtures are transaction-scoped and rolled back; browser fixtures are local-only and
removed after the suite.

Schema changes must review RLS, grants, indexes used by policies, migration behavior, and recovery
expectations as one unit. Rate limiting, billing controls, and workflow-specific audit emission do
not exist yet.
