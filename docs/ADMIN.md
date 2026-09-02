# Core administration

Status: the unified authenticated tenant-admin foundation and the separate super-admin control
plane are implemented across business,
location, capability, appearance, shared media, custom-domain, business-language, and Restaurant
content surfaces. Member, permission, billing, and analytics interfaces remain out of scope.

## Current-business routing

`/b/[businessSlug]` is the durable business context for all tenant administration. The protected
layout resolves the slug from the authenticated user's RLS-visible businesses, builds one compact
business-wide access snapshot, and loads RLS-visible locations and capability state. Unauthorized
slugs fail closed.

The business chooser appears at `/` when more than one business is accessible; one business
redirects directly to its workspace. The switcher lists only authorized businesses and preserves a
registered core top-level section when safe. Resource-specific paths fall back to that section's
list. Engine and unregistered paths fall back to the target business Overview until the target
business's capability/access state can be resolved. Tenant identity is never sourced solely from
local storage.

## Available sections

- `/b/[businessSlug]` shows the real platform-state Overview and setup guidance;
- `/b/[businessSlug]/settings` reads core identity, locale, currency, timezone, and lifecycle;
- `/b/[businessSlug]/modules` reads the platform registry and current business capability state;
- `/b/[businessSlug]/appearance` resolves enabled template contexts and controlled theme state;
- `/b/[businessSlug]/media` uploads, describes, lists, and archives shared business assets;
- `/b/[businessSlug]/domains` manages ownership verification, Restaurant targeting, provider
  connection state, primary host selection, and disconnect;
- `/b/[businessSlug]/languages` manages the enabled locale set and canonical default;
- `/b/[businessSlug]/locations` lists only locations visible through RLS;
- `/b/[businessSlug]/locations/new` creates a reusable core location;
- `/b/[businessSlug]/locations/[locationId]` edits or archives one accessible location.
- `/b/[businessSlug]/restaurant` is the capability- and permission-gated Restaurant workspace;
- `/b/[businessSlug]/restaurant/menus` manages menus, categories, items, and localized content;
- `/b/[businessSlug]/restaurant/items/[itemId]` manages variants, modifiers, and location state;
- `/b/[businessSlug]/restaurant/modifiers` manages the reusable modifier library.

One typed, ordered navigation registry owns the implemented Workspace, Business, Experience,
Products, and future Governance groups. The protected layout resolves and filters it from the
server-authoritative access snapshot and effective module state. Route and mutation authorization
remain independent of navigation visibility. Modules are a read surface for authorized business
members; controls require `modules.manage` and an active business. Locations appear only when the caller has
business-wide location access or at least one exact location is visible. Creating requires
business-wide `locations.manage`; updating or archiving accepts business-wide or matching
location-scoped `locations.manage`. Business edits require `business.manage`.

Media and Domains navigation appears only with `media.manage` or `domains.manage`; the underlying
pages remain RLS-readable if an authorized member follows a direct link, but controls are absent.
Languages is broadly visible and becomes editable only with `business.manage`. All three sections
are mutation-disabled unless the business is active.

Appearance is broadly visible to authorized members. It lists only effectively enabled modules
that have platform templates; edit controls require `appearance.manage` and an active business. A
zero-context state links back to Modules without pretending an engine exists. Restaurant appears
as an engine navigation contribution only when its capability is effectively enabled and the user
has `restaurant.read` or `restaurant.manage`; all other enabled engine capabilities continue to be
labelled honestly as pending.

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
initiating user's permission check. Deployment connection uses the same trust shape: a server-only
provider adapter forwards only a reviewed routing outcome through a separate service-only RPC, while
target, connect request, primary, and disconnect remain normal authenticated operations. Language
updates use one atomic `business.manage` RPC.

Appearance uses normal authenticated reads plus narrow save/reset RPCs. Template selection and
semantic overrides commit with redacted audit events. The live preview uses `@darb/theme`, the same
typed resolution contract reserved for future renderers; no privileged client is involved.

Business currency is read-only until monetary workflows provide a safe product policy. Tenant admins
may select `active` or `archived`; `suspended` remains platform-controlled. Locations can be active,
inactive, or archived. Archive is non-destructive, idempotent, and read-only; restore is deferred.

## Interface foundation

The shell provides a stable Darb identity, obvious current-business context, grouped selected-state
navigation, lifecycle communication, and an intentionally constrained content region. Desktop uses
a proportioned fixed workspace rail. Tablet and mobile use a focus-trapped, scroll-locking drawer
with Escape dismissal and focus restoration. The business selector is keyboard-operable, handles
long names, and is usable inside either shell.

The Overview derives identity, visible location count, enabled languages and modules, active media,
verified/primary domains, and appearance state from RLS-visible platform data. Readiness is expressed
as actionable required, recommended, and optional checks rather than a fabricated score. Enabled
capabilities whose engines do not exist are explicitly identified as enabled but not yet available.

Reusable admin-local primitives provide compact page headers and breadcrumbs, semantic status
labels, lifecycle notices, page-shaped skeletons, empty/error/read-only states, and an accessible
confirmation dialog. High-impact location archive and capability disable actions use the shared
dialog rather than browser confirmation. Native form status remains inline and screen-reader
announced; no global client-state or toast dependency is required.

Cairo, Heebo, and Ubuntu remain the approved script fonts; mixed-direction data uses explicit
direction handling. The shell retains semantic landmarks, skip navigation, visible focus,
touch-sized actions, `aria-current`, reduced-motion handling, and responsive layout behavior.

## Static engine extension contract

`AdminEngineContribution` is the lightweight application-level contract for engine-owned
navigation. A contribution names its module key and provides typed navigation items with route and
permission requirements. Composition is static and build-time controlled: there is no runtime code
injection, marketplace, or plugin loader. Restaurant is the first implementation: one contribution
registers its section while route-level access and Server Actions independently repeat
authorization.

## Platform control plane

`/platform` is an explicit Darb operator context available only after a server/database
super-admin check. It has its own shell and Overview, Businesses, Users, Modules, Templates,
Domains, and Audit sections. Tenant administrators never receive its navigation or data. Large
directories are database-filtered and paginated rather than loaded into client memory.

The business directory supports safe inspection and audited suspend/archive/reactivate actions.
The user directory is an allow-listed Auth projection; super-admin assignment management is
read-only. Module and template registries are also read-only in this phase. Global domain and audit
views exclude verification proof, provider payloads, and audit metadata. Full contracts and
deferrals are in [`PLATFORM_ADMIN.md`](./PLATFORM_ADMIN.md).

A super admin may open a tenant workspace without a fabricated membership because existing RLS
helpers intentionally recognize platform authority. The business shell identifies this access and
retains the operator's real session identity. Platform Admin and Business Workspace links make the
context switch explicit.

Admin publishes layered `noindex` controls, a non-privileged liveness route, application/root error
states, and shared production security headers. Request errors and domain-provider failures use
sanitized structured logging. Public Supabase variables remain distinct from conditional,
server-only DNS/provider attestation credentials; details are in [`PRODUCTION.md`](./PRODUCTION.md).

## Intentionally deferred

- engine KPIs, analytics dashboards, and configurable dashboard widgets;
- additional-business creation beyond first-business bootstrap;
- member invitations, membership, role, and permission editors;
- mutation workflows for platform module/template registries and super-admin assignments;
- location restoration or hard deletion;
- physical media deletion, transformations, folders, and engine-specific references;
- domain wildcards, provider webhooks/background reconciliation, and DNS mutation automation;
- bulk translation workflows and automated locale fallback;
- all ordering, booking, commerce, pages runtime, advanced theme, and billing work.
