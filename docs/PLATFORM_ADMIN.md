# Platform administration

Status: the first Darb platform control plane is implemented in `apps/admin`. It is a distinct
operator context from tenant business administration.

## Route and context boundary

`/platform/*` is reserved for authenticated users whose active assignment is verified by
`core.current_user_is_super_admin()`. The protected layout and every platform data loader repeat
that check server-side. Unauthenticated requests enter the existing safe login flow; authenticated
non-super-admins return to the normal business chooser. Tenant permissions never confer platform
authority.

The platform shell provides Overview, Businesses, Users, Domains, Modules, Templates, and Audit.
Super admins receive an explicit Platform Admin entry in eligible tenant shells and an operator
notice when entering `/b/[businessSlug]` through platform authority. Their real identity remains in
the session and audit record; Darb creates no synthetic membership and performs no impersonation.

## Data boundary

Authenticated `SECURITY DEFINER` functions project only the fields needed by the operator UI. They
use empty `search_path` values, qualified object names, fixed SQL, bounded page sizes, and an active
`private.super_admins` check. `private` and `auth` remain absent from generated browser-facing types.

- overview returns factual operational totals;
- business list/detail returns tenant identity, lifecycle, counts, locales, capability state,
  domain state, safe appearance selection, and Restaurant publication state;
- users returns only Auth UUID, email, creation time, super-admin decision, and membership summary;
- the super-admin roster is read-only and exposes only UUID, email, grant/revocation timestamps,
  and state;
- modules/templates return safe registry metadata and adoption counts, never theme documents;
- domains exclude ownership proof and provider payloads;
- audit excludes the metadata document and paginates the allow-listed event envelope.

Businesses, users, domains, and audit use database pagination. Search and filters execute in the
projection rather than loading the tenant estate into the browser. The application calls these
functions from Server Components through a request-scoped authenticated client; no service key is
used by the control plane.

## Lifecycle operations

Phase 14 exposes one write: an explicit business lifecycle transition. A platform super admin may
suspend or archive an active business, and may reactivate a suspended or archived business. The
RPC locks the tenant row, validates the transition, derives the actor from `auth.uid()`, retains all
tenant data, and atomically emits one of:

- `platform.business_suspended`;
- `platform.business_archived`;
- `platform.business_reactivated`.

An unchanged request is a no-op and emits no audit event. The UI uses the shared accessible
confirmation dialog and returns to the canonical detail URL with an announced outcome. There is no
hard-delete control.

## Deliberate read-only areas

Super-admin assignments, module availability, template availability/defaults, Auth account state,
and domain routing remain inspection-only. Their consequences require dedicated recovery and
last-operator safety designs before mutation UI is appropriate. Template authoring, raw Auth
metadata, domain verification tokens, provider responses, raw SQL, and arbitrary impersonation are
not exposed.

## Interface behavior

The platform shell is visually distinct while retaining Darb Admin typography, status, focus,
error, loading, empty-state, and confirmation conventions. Desktop uses the operator rail; tablet
and mobile use the focus-trapped drawer with Escape dismissal, scroll lock, and focus restoration.
Operational tables remain bounded and paginated, use a fixed container layout on tablet, and become
labelled record cards on small mobile screens.
