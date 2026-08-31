# Core administration

Status: authenticated business, location, and capability administration is implemented. Member,
permission, engine, billing, media, domain, and analytics interfaces remain out of scope.

## Current-business routing

`/b/[businessSlug]` is the durable business context for all tenant administration. The protected
layout resolves the slug from the authenticated user's RLS-visible businesses, builds one compact
business-wide access snapshot, and loads RLS-visible locations and capability state. Unauthorized
slugs fail closed.

The business chooser appears at `/` when more than one business is accessible; one business redirects
directly to its workspace. The switcher lists only authorized businesses and preserves settings,
modules, or the location-list section when safe. Tenant identity is never sourced solely from local
storage.

## Available sections

- `/b/[businessSlug]` shows the minimal core business summary;
- `/b/[businessSlug]/settings` reads core identity, locale, currency, timezone, and lifecycle;
- `/b/[businessSlug]/modules` reads the platform registry and current business capability state;
- `/b/[businessSlug]/locations` lists only locations visible through RLS;
- `/b/[businessSlug]/locations/new` creates a reusable core location;
- `/b/[businessSlug]/locations/[locationId]` edits or archives one accessible location.

Navigation contains only these implemented sections. Modules are a read surface for authorized
business members; controls require `modules.manage` and an active business. Locations appear only
when the caller has
business-wide location access or at least one exact location is visible. Creating requires
business-wide `locations.manage`; updating or archiving accepts business-wide or matching
location-scoped `locations.manage`. Business edits require `business.manage`.

## Mutation and audit boundary

Server Actions authenticate and re-resolve the business through the normal request-scoped Supabase
client, validate normalized form values, and call narrow `core` RPCs. RLS/database helpers remain
authoritative, and the privileged client is not used. Each successful write atomically emits one of
`business.updated`, `location.created`, `location.updated`, or `location.archived` with allowlisted
metadata.

Module state uses its own narrow Server Action and `core.set_business_module_enabled` RPC. It emits
`business.module_enabled` or `business.module_disabled` only for actual transitions. The page is
explicit that capability state does not launch an engine, create engine data, or represent billing.

Business currency is read-only until monetary workflows provide a safe product policy. Tenant admins
may select `active` or `archived`; `suspended` remains platform-controlled. Locations can be active,
inactive, or archived. Archive is non-destructive, idempotent, and read-only; restore is deferred.

## Interface foundation

The shell is responsive across desktop, tablet, and mobile, with an accessible drawer, native
keyboard-operable business selector, visible focus, touch-sized actions, labeled/error-associated
forms, pending states, permission notices, empty states, and reduced-motion handling. Cairo, Heebo,
and Ubuntu remain the approved script fonts; mixed-direction data uses explicit direction handling.

## Intentionally deferred

- full dashboard analytics and final navigation hierarchy;
- additional-business creation beyond first-business bootstrap;
- member invitations, membership, role, and permission editors;
- platform module-registry and super-admin interfaces;
- location restoration or hard deletion;
- all restaurant, booking, commerce, pages, media, domain, theme, and billing work.
