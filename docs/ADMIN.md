# Core administration

Status: authenticated business, location, capability, appearance, shared media, custom-domain, and
business language administration is implemented. Member, permission, engine, billing, and
analytics interfaces remain out of scope.

## Current-business routing

`/b/[businessSlug]` is the durable business context for all tenant administration. The protected
layout resolves the slug from the authenticated user's RLS-visible businesses, builds one compact
business-wide access snapshot, and loads RLS-visible locations and capability state. Unauthorized
slugs fail closed.

The business chooser appears at `/` when more than one business is accessible; one business redirects
directly to its workspace. The switcher lists only authorized businesses and preserves settings,
modules, appearance, or the location-list section when safe. Tenant identity is never sourced solely from local
storage.

## Available sections

- `/b/[businessSlug]` shows the minimal core business summary;
- `/b/[businessSlug]/settings` reads core identity, locale, currency, timezone, and lifecycle;
- `/b/[businessSlug]/modules` reads the platform registry and current business capability state;
- `/b/[businessSlug]/appearance` resolves enabled template contexts and controlled theme state;
- `/b/[businessSlug]/media` uploads, describes, lists, and archives shared business assets;
- `/b/[businessSlug]/domains` manages retained DNS-verified hostname claims;
- `/b/[businessSlug]/languages` manages the enabled locale set and canonical default;
- `/b/[businessSlug]/locations` lists only locations visible through RLS;
- `/b/[businessSlug]/locations/new` creates a reusable core location;
- `/b/[businessSlug]/locations/[locationId]` edits or archives one accessible location.

Navigation contains only these implemented sections. Modules are a read surface for authorized
business members; controls require `modules.manage` and an active business. Locations appear only
when the caller has
business-wide location access or at least one exact location is visible. Creating requires
business-wide `locations.manage`; updating or archiving accepts business-wide or matching
location-scoped `locations.manage`. Business edits require `business.manage`.

Media and Domains navigation appears only with `media.manage` or `domains.manage`; the underlying
pages remain RLS-readable if an authorized member follows a direct link, but controls are absent.
Languages is broadly visible and becomes editable only with `business.manage`. All three sections
are mutation-disabled unless the business is active.

Appearance is broadly visible to authorized members. It lists only effectively enabled modules
that have platform templates; edit controls require `appearance.manage` and an active business. A
zero-context state links back to Modules without pretending an engine exists.

## Mutation and audit boundary

Server Actions authenticate and re-resolve the business through the normal request-scoped Supabase
client, validate normalized form values, and call narrow `core` RPCs. RLS/database helpers remain
authoritative, and the privileged client is not used. Each successful write atomically emits one of
`business.updated`, `location.created`, `location.updated`, or `location.archived` with allowlisted
metadata.

Module state uses its own narrow Server Action and `core.set_business_module_enabled` RPC. It emits
`business.module_enabled` or `business.module_disabled` only for actual transitions. The page is
explicit that capability state does not launch an engine, create engine data, or represent billing.

Media registration reserves a database-derived path before the browser uploads directly through
Storage RLS. Completion, alt-text updates, and archive use normal authenticated RPCs. Domain claims
use normal authenticated RPCs except for DNS verification evidence: Node resolves TXT records and a
server-only client attests only the boolean outcome through a service-only RPC that repeats the
initiating user's permission check. Language updates use one atomic `business.manage` RPC.

Appearance uses normal authenticated reads plus narrow save/reset RPCs. Template selection and
semantic overrides commit with redacted audit events. The live preview uses `@darb/theme`, the same
typed resolution contract reserved for future renderers; no privileged client is involved.

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
- physical media deletion, transformations, folders, and engine-specific references;
- production custom-domain routing, provider attachment, and SSL automation;
- translated engine content and translation-management tooling;
- all restaurant, booking, commerce, pages engine/runtime, advanced theme, and billing work.
