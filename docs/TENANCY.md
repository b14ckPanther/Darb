# Tenancy

Status: Phase 2 core model implemented through version-controlled Supabase migrations.

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
`core.business_modules`, and business-scoped `core.audit_events` point directly to it.
`core.membership_permissions` carries `business_id` and uses composite foreign keys to guarantee
that its membership and optional location belong to the same business.

`core.profiles` is one-to-one with `auth.users`. An auth trigger creates only the profile identity
row; it deliberately does not trust or copy user metadata. Deleting an auth user removes its profile
and memberships while historical creator and audit actor references become null where appropriate.

Memberships currently have `active` and `suspended` states and are unique per business/user pair.
An invitation is not a membership: pending email invitations, acceptance, expiry, and resend flows
remain a separate future model.

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
`permissions.manage`, `modules.manage`, and `audit.view`. A grantor must possess both
`permissions.manage` and the permission being delegated at an equal or broader scope. This prevents
self-escalation and scope escalation. Role templates and richer permission catalogues remain future
product work.

## Platform administration

Active rows in `private.super_admins` represent platform super admins independently of all tenant
memberships. The table is not exposed through the Data API and has no normal client mutation policy.
A super admin is a product authorization identity; a Supabase secret/service-role client is a
technical database bypass and is not conceptually promoted to super admin.

Super-admin provisioning and revocation require a separately controlled operational process. They
must never be implemented as a normal self-service client write.

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

- business creation and onboarding workflows;
- invitation lifecycle and acceptance;
- product role templates and additional permission keys;
- super-admin operational tooling;
- engine-owned schemas and tables;
- authentication and administration interfaces.

See [`DATABASE.md`](./DATABASE.md) for exact table and policy responsibilities.
