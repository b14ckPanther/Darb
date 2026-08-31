# Tenancy direction

Status: conceptual model only. No database schema or authorization implementation exists yet.

## Core model

The future tenancy model is based on a canonical business identity:

- a business has one stable platform identity independent of products or public presentation;
- a user may be authorized to manage multiple businesses;
- a business may contain multiple locations;
- access is granted through explicit permissions within a tenant scope;
- product or engine enablement does not redefine the canonical business identity.

Tenant-controlled information—including branding, themes, locations, schedules, content, modules,
services, products, and prices—must come from authorized data sources. It must never be embedded as
application constants.

## Authorization roles

The intended authorization vocabulary includes:

- **super admin** — platform-level operations across tenant boundaries;
- **business admin** — full administration within an authorized business;
- **manager** — operational management within granted business or location scope;
- **staff** — constrained operational actions;
- **editor/content manager** — content-focused changes without broad operational authority;
- **read-only** — view access without mutation rights.

These are product concepts, not database enum values. Permissions should be composable and checked
against tenant and location scope so that role labels do not become brittle authorization logic.
Exact permission names, inheritance, invitations, and membership lifecycle remain deferred.

## Isolation requirements

Strict tenant isolation is mandatory. When implementation begins:

- every tenant-owned record must have an unambiguous ownership path;
- server-side authorization and Supabase RLS must agree on the effective tenant and permission;
- client-provided tenant identifiers must never be trusted on their own;
- privileged platform access must be explicit, narrow, auditable, and separate from tenant access;
- tests must prove both allowed access and denied cross-tenant access;
- multi-location access must be scoped without duplicating canonical business identity.

## Deferred implementation

No businesses, locations, memberships, roles, permissions, users, policies, or tenant tables are
defined in this phase. The eventual schema must be reviewed together with its RLS policies, threat
model, migration plan, and negative isolation tests.
