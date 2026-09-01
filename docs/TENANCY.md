# Tenancy

Status: core tenancy, first-business bootstrap, explicit business route context, and permission-aware
business/location administration are implemented through version-controlled changes.

## Core model

The tenancy model is based on a canonical business identity:

- a business has one stable platform identity independent of products or public presentation;
- a user may be authorized to manage multiple businesses;
- a business may contain multiple locations;
- an active membership establishes the user-to-business relationship;
- authorization is granted through explicit permission assignments at business or optional location
  scope;
- product or engine enablement does not redefine the canonical business identity.

Tenant-controlled information—including branding, themes, locations, schedules, content, modules,
services, products, and prices—must come from authorized data sources. It must never be embedded as
application constants.

## Implemented ownership paths

`core.businesses` is the tenant root. `core.locations`, `core.memberships`,
`core.business_modules`, `core.media_assets`, `core.business_domains`, `core.business_locales`, and
business-scoped `core.audit_events` point directly to it.
`core.membership_permissions` carries `business_id` and uses composite foreign keys to guarantee
that its membership and optional location belong to the same business.

`core.profiles` is one-to-one with `auth.users`. An auth trigger creates only the profile identity
row; it deliberately does not trust or copy user metadata. Deleting an auth user removes its profile
and memberships while historical creator and audit actor references become null where appropriate.

Memberships currently have `active` and `suspended` states and are unique per business/user pair.
An invitation is not a membership: pending email invitations, acceptance, expiry, and resend flows
remain a separate future model.

The admin application always resolves the full RLS-visible business list. It does not assume one
user equals one business. `/b/[businessSlug]` is the durable current-business context: every slug is
resolved server-side from that authorized list, unauthorized slugs fail as unavailable, and the
business switcher changes the route rather than storing critical tenant identity in local storage.
It preserves settings or location-list context where safe; a location detail cannot be carried to
another tenant because resource IDs are tenant-owned.

Business settings remain readable to active members. Editing requires `business.manage`.
Business-wide `locations.read` or `locations.manage` reveals all locations; exact location-scoped
assignments reveal only matching rows through RLS. Creating a location requires business-wide
`locations.manage`, while editing or archiving accepts business-wide or matching location-scoped
`locations.manage`.

The business route context also resolves all platform module definitions and the caller-visible
`core.business_modules` rows. Authorized members may read this state; only business-wide
`modules.manage` can change it. Absence means disabled, and capability state remains independent
from membership permissions and tenant identity.

Shared media, domain claims, and enabled locale rows are business-owned core resources. Immutable
media paths use business UUIDs; hostname claims are globally unique but every read and mutation is
tenant-resolved; locale rows use `(business_id, locale_code)` identity and cannot contradict the
business's canonical default locale.

## Permission model

The intended authorization vocabulary includes:

- **super admin** — platform-level operations across tenant boundaries;
- **business admin** — full administration within an authorized business;
- **manager** — operational management within granted business or location scope;
- **staff** — constrained operational actions;
- **editor/content manager** — content-focused changes without broad operational authority;
- **read-only** — view access without mutation rights.

These remain product concepts, not database enum values. Authorization is implemented with stable
keys in `core.permissions` and normalized rows in `core.membership_permissions`. An assignment with
no `location_id` applies business-wide; a location assignment applies only to that location and is
accepted only when the permission definition supports location scope.

The initial platform permission registry contains only the keys needed to secure the foundation:
`business.manage`, `locations.read`, `locations.manage`, `memberships.manage`,
`permissions.manage`, `modules.manage`, `media.manage`, `domains.manage`, and `audit.view`. A grantor must possess both
`permissions.manage` and the permission being delegated at an equal or broader scope. This prevents
self-escalation and scope escalation. Role templates and richer permission catalogues remain future
product work.

The trusted first-business function assigns all nine keys above at business scope. The bundle is
fixed in database code and cannot be chosen by a browser. Future onboarding must not turn that
bootstrap exception into a general membership or permission management path.

## First-business boundary

`core.bootstrap_first_business(display_name, slug, locale)` is the only normal-user path that can
create the initial tenant. It derives the owner from `auth.uid()`, serializes concurrent calls for
that auth user, and atomically creates the business, active membership, reviewed permission bundle,
and `business.created` audit event. It applies ILS and `Asia/Jerusalem` through the core business
defaults and enables no modules.

The Phase 6 forward migration extends the bootstrap bundle with `media.manage` and
`domains.manage`. Its idempotent migration-time backfill grants those keys only to active
memberships that already held the complete original seven-key owner bundle; arbitrary memberships
are not broadened.

An exact retry returns the existing business. A different request is rejected while the caller has
an active membership. A suspended membership is not active access, so the user may establish a new
first active business; this behavior is intentional and tested. General additional-business,
membership, and invitation workflows remain separate future authorization designs.

## Platform administration

Active rows in `private.super_admins` represent platform super admins independently of all tenant
memberships. The table is not exposed through the Data API and has no normal client mutation policy.
A super admin is a product authorization identity; a Supabase secret/service-role client is a
technical database bypass and is not conceptually promoted to super admin.

Super-admin provisioning and revocation require a separately controlled operational process. They
must never be implemented as a normal self-service client write.

## Lifecycle semantics

Business `active` and `archived` states are tenant-controlled through the audited settings
boundary. Archived means retained and intentionally out of normal operation; it does not delete or
revoke the tenant relationship, and an authorized business administrator may reactivate it.
`suspended` is reserved for explicit platform enforcement: tenant administrators cannot enter or
leave that state.

Location `active` means operational, `inactive` means temporarily unavailable, and `archived` means
retired and retained for historical integrity. Authorized managers may move between active and
inactive. Archive is a separate, idempotent action; archived locations are read-only and are never
hard-deleted through the admin UI. Restoration is intentionally deferred.

Capability mutations are allowed for tenant admins only while the business is active. Suspended
businesses require an explicit platform super admin at the database boundary; archived businesses
must be reactivated before changes. A platform-unavailable module retains existing tenant state but
is not effectively enabled and cannot be newly enabled.

Media, domain, and locale mutations are also active-business operations. Media and domain records
are retained when archived or disabled, and platform-suspended businesses cannot advance DNS
verification. Business locale changes keep the new default enabled in the same transaction.

## Isolation requirements

Strict tenant isolation is mandatory and currently enforced as follows:

- every tenant-owned record must have an unambiguous ownership path;
- server-side authorization and Supabase RLS must agree on the effective tenant and permission;
- client-provided tenant identifiers must never be trusted on their own;
- privileged platform access must be explicit, narrow, auditable, and separate from tenant access;
- pgTAP tests prove allowed access and denied cross-tenant, out-of-scope, anonymous, and
  self-escalation access;
- multi-location access must be scoped without duplicating canonical business identity.

## Deferred work

- general additional-business creation workflows;
- invitation lifecycle and acceptance;
- product role templates and additional permission keys;
- super-admin operational tooling;
- engine-owned schemas and tables;
- member, permission, platform-module-registry, and location-restoration interfaces.

See [`MODULES.md`](./MODULES.md) for capability semantics and the future engine-gating boundary.

See [`AUTH.md`](./AUTH.md) for session and protected-routing behavior and [`DATABASE.md`](./DATABASE.md)
for exact table and policy responsibilities.
