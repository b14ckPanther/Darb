# Security principles

Status: RLS-first database authorization, server-resolved Supabase sessions, protected admin
routing, and a narrow first-business trust boundary are implemented. Controls tied to future
business workflows remain deferred until those workflows exist.

## Data access

Supabase security is RLS-first. Every `core` table and `private.super_admins` has Row Level Security
enabled with explicit policies. Database policy is the final data boundary; future API handlers and
server actions must also authorize requests server-side to provide clear failures and defense in
depth.

Table grants are opt-in and column-limited for authenticated mutations. Anonymous users receive no
access to `core` or `private`. The `private` schema is not exposed through the Data API. Its small
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

## Privileged boundaries

`private.super_admins` holds explicit, revocable platform authorization and is separate from tenant
membership. Normal clients cannot read or mutate it. A Supabase secret or legacy service-role key
bypasses RLS as a technical capability; it does not create a super-admin product identity and must
be limited to audited, trusted server paths.

`@darb/database/browser` and `@darb/database/server` accept publishable keys. The privileged factory
is a separate `server-only` export, disables session persistence and refresh behavior, and requires
its secret explicitly. No application uses it yet.

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

Return paths are accepted only as same-origin relative paths. Sign-in errors remain generic to avoid
account enumeration. Sign-out is local to the current session. The app never uses the privileged
client for ordinary auth, tenant reads, permission checks, or onboarding.

Dependency updates, framework configuration, redirects, uploads, webhooks, and future integrations
require security review proportional to their risk.

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

## Bootstrap security

`core.bootstrap_first_business` is a narrowly granted `security definer` function. It uses an empty
`search_path`, schema-qualified objects, no dynamic SQL, and `auth.uid()` rather than caller-supplied
identity. It validates display name, slug, and locale in Postgres; accepts no permission list or
target user; assigns a fixed seven-permission bundle; and executes only for `authenticated`.
Unauthenticated, cross-user, arbitrary-permission, duplicate-slug, concurrency, and tenant-isolation
behavior is covered at the database layer.

## Controls added with future workflows

Sensitive public flows will be rate-limited and abuse-aware when those endpoints exist. Sensitive
administrative operations will use the audit-event foundation when their server workflows are
implemented. Password reset, sign-up, invitations, OAuth, magic links, MFA, session-duration policy,
content-security policy, upload validation, audit retention, recovery, monitoring, and incident
response remain deferred until their concrete surfaces exist.

## Verification

Security-relevant changes must include tests for denied access, not only successful paths. Current
pgTAP coverage changes session roles and JWT subjects to exercise RLS for tenant users, a super
admin, and anonymous access. It verifies cross-business denial, location scope, mutation denial,
permission self-escalation denial, super-admin self-promotion denial, audit and module isolation,
plus unauthenticated and adversarial first-business bootstrap cases. Phase 4 coverage additionally
proves business lifecycle restrictions, cross-tenant mutation denial, business-wide versus exact
location scope, append-only audit emission, anonymous denial, and explicit super-admin behavior.
Database fixtures are transaction-scoped and rolled back; browser fixtures are local-only and
removed after the suite.

Schema changes must review RLS, grants, indexes used by policies, migration behavior, and recovery
expectations as one unit. Rate limiting, billing controls, and workflow-specific audit emission do
not exist yet.
