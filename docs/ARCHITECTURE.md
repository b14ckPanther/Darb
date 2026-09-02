# Architecture

Status: accepted foundation direction. This document describes boundaries and deployment shape, not
implemented product capabilities.

## System shape

Darb begins as a modular monorepo managed by pnpm workspaces and Turborepo. Deployable surfaces use
the Next.js App Router and can be released independently while sharing reviewed platform packages.

| Area                  | Responsibility                                              |
| --------------------- | ----------------------------------------------------------- |
| `apps/main`           | Public root-domain application for `darb.co.il`             |
| `apps/admin`          | Platform administration application for `admin.darb.co.il`  |
| `apps/rest`           | Public Restaurant renderer for `rest.darb.co.il`            |
| `packages/config`     | Shared tooling, HTTP-security, logging, and platform config |
| `packages/types`      | Genuinely platform-wide type contracts                      |
| `packages/ui`         | Darb platform/admin UI foundation                           |
| `packages/icons`      | Curated icon and custom-SVG boundary                        |
| `packages/i18n`       | Locale and direction primitives                             |
| `packages/theme`      | Typed customer-facing theme contract and resolver           |
| `packages/restaurant` | Pure Restaurant Engine types and domain-state helpers       |
| `packages/database`   | Generated DB types and separated Supabase client factories  |
| `supabase`            | Core migrations, RLS policies, local config, and DB tests   |

Turborepo owns the common `dev`, `build`, `lint`, `typecheck`, and `test` task graph. Each workspace
keeps an explicit manifest and exposes only intentional entry points.

## Application and engine boundaries

Darb is multi-product. A future engine receives a focused boundary when its real requirements are
approved; it is not embedded indiscriminately into `apps/main` or `apps/admin`. Domain logic remains
inside the owning engine. A package moves into `packages/*` only after it is demonstrably a shared
platform concern.

Future public engines may use dedicated subdomains beneath `darb.co.il`. Naming, routing, and
deployment topology will be chosen per engine rather than reserved speculatively now.

Cross-boundary imports should flow from applications or engines toward stable shared packages.
Engine-to-engine imports and circular workspace dependencies are prohibited.

## Data platform

The accepted starting point is one Supabase project. This keeps authentication, Postgres, storage,
and policy management coherent while the platform model is established. The implemented `core`
schema owns canonical businesses, reusable locations, memberships, permission assignments, module
enablement, platform templates, tenant appearance state, shared media metadata, custom-domain
claims, business locale state, minimal profiles, and audit events. Non-exposed authorization
helpers and platform super-admin assignments live in `private`.

The first engine boundary is `restaurant.*`. It owns configuration, menus, categories, items,
variants, modifier structures, localized content, and location availability overrides while
referencing canonical `core` businesses, locations, media, locales, currency, permissions, module
state, and audit events. `@darb/restaurant` contains only generated-type aliases and pure domain
semantics. Its authenticated administration stays in `apps/admin`; its customer-facing renderer
lives in the dedicated `apps/rest` deployment.

`apps/rest` resolves platform-slug and verified live custom-host routes server-side through one
curated anonymous projection. It never reads Restaurant administration tables directly. The
projection combines the active tenant,
effective Restaurant capability, public configuration, enabled locales, active locations, resolved
template/theme, published menu graph, safe media fields, modifiers, and location overrides. A null
projection fails closed. Host routing uses an anonymous-safe exact-host resolver and an internal
Next.js rewrite; custom and platform routes share one renderer. Canonical origin prefers the
primary live Restaurant hostname and otherwise falls back to `rest.darb.co.il`.

Search discovery uses a second narrow anonymous projection rather than raw table access. It returns
only indexable Restaurant slugs, locales, and trusted primary hostnames. Metadata, language
alternates, structured-data URLs, robots, and sitemaps share the canonical-origin resolver. The
public app remains RSC-first and loads a complete publication graph without N+1 reads.

Cross-application production concerns remain small shared contracts: `@darb/config/http` constructs
an application-specific static security-header baseline, while `@darb/config/observability` emits
sanitized structured request errors. Application-owned error boundaries and liveness routes stay in
their deployable surfaces. Restaurant analytics uses a typed engine contract plus an app-owned
provider adapter; its baseline adapter is intentionally no-op and creates no persistence service.

Tenant boundaries are enforced in Postgres through explicit grants, Row Level Security, and
scope-aware authorization helpers. Applications must repeat authorization server-side for defense
in depth; application filtering is never the data boundary. Migrations include only stable platform
module and permission definitions—no tenant seed data. Remote application is environment-specific
and must be verified with `supabase migration list` before deployment.

The admin application uses request-scoped Supabase SSR clients. Next.js Proxy refreshes auth
cookies, while Server Components and Server Actions resolve identity and RLS-visible tenants at the
route or mutation boundary. A narrow database RPC owns the atomic first-business bootstrap. No
privileged client is used in normal admin application flows.

Authenticated administration uses `/b/[businessSlug]` as the explicit current-business context.
The route slug is resolved only from the caller's complete RLS-visible business list. A protected
segment layout provides the business shell and a permission snapshot, while focused pages and
Server Actions re-resolve the tenant and resource at their own trust boundaries. Business and
location writes use narrow authenticated RPCs so each mutation and its redacted audit event commit
atomically.

The tenant-admin shell is composed from one typed static navigation registry. Core sections and
future engine contributions share the same item contract, but the server-resolved permission and
effective-module snapshot filters every business instance before rendering. This is build-time
application composition, not runtime plugin loading. The Overview parallelizes ordinary
RLS-visible platform reads and derives honest setup guidance without persisting dashboard state.
Platform super administration remains a separate future route/application concern.

Shared media uses two platform buckets—images and videos—rather than tenant or engine buckets. UUID-
derived paths and Storage RLS bind uploads to a database reservation; kind-specific buckets enforce
the reviewed size/MIME ceilings, and completion rechecks stored metadata before activation. Public
read is deliberate for future QR-heavy delivery, while all writes remain authenticated and
permission-bound.

Custom-domain ownership remains independent from routing infrastructure. An explicit module target
and provider-attested routing lifecycle prevent a verified ownership claim from implying a live
site. Node DNS and Vercel checks each cross a narrow service-only attestation boundary that rechecks
the initiating user's `domains.manage` permission. Only Restaurant is an implemented public target.

The module/capability registry is a shared platform concern, while engines remain isolated
implementations. The current-business context loads RLS-visible capability state and provides a
server-side enablement gate. Capability enablement never replaces engine-specific authorization or
creates engine data. Restaurant contributes its authenticated admin route statically when both
effective capability state and Restaurant permission are present; other enabled engines remain
honestly unavailable until their implementation phase.

The template/theme foundation remains separate from both module enablement and the admin design
system. Platform-owned templates are scoped to a module rendering context; tenant rows store only a
selection and validated semantic overrides. `@darb/theme` is a pure shared contract used by the
admin preview and future server renderers. It maps a closed token set to controlled CSS variables,
locale-aware typography, direction, contrast decisions, and reduced-motion behavior. No arbitrary
CSS or customer-facing runtime route exists.

Splitting data services or introducing microservices requires demonstrated scale, security,
ownership, or operational needs; it is not a foundation goal.

## Deployment

The monorepo is Vercel-compatible. The intended production shape is one Vercel project per Next.js
application, connected to the same repository with its own application root, environment variables,
domain, and deployment lifecycle. Shared workspaces remain resolved through the root pnpm lockfile.

Preview and production secrets belong in deployment environment configuration, never in Git.

## Deferred decisions

- other engine application names and subdomains;
- remote migration deployment and operational rollout;
- registration, invitations, password recovery, MFA, and detailed session policy;
- locale negotiation beyond the explicit Restaurant platform-slug route contract;
- public engines beyond Restaurant, wildcard domains, and background provider reconciliation;
- controlled physical media cleanup and image transformation;
- member, permission, platform-module-registry, and super-admin management interfaces;
- customer-facing rendering for engines beyond Restaurant and advanced cache invalidation;
- external observability vendors, queues, and background processing needs.

These decisions should be made when their requirements are concrete. No premature microservices or
empty engine applications should be introduced.
