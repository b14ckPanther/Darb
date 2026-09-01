# Architecture

Status: accepted foundation direction. This document describes boundaries and deployment shape, not
implemented product capabilities.

## System shape

Darb begins as a modular monorepo managed by pnpm workspaces and Turborepo. Deployable surfaces use
the Next.js App Router and can be released independently while sharing reviewed platform packages.

| Area                | Responsibility                                             |
| ------------------- | ---------------------------------------------------------- |
| `apps/main`         | Public root-domain application for `darb.co.il`            |
| `apps/admin`        | Platform administration application for `admin.darb.co.il` |
| `packages/config`   | Shared build, lint, TypeScript, and platform constants     |
| `packages/types`    | Genuinely platform-wide type contracts                     |
| `packages/ui`       | Darb platform/admin UI foundation                          |
| `packages/icons`    | Curated icon and custom-SVG boundary                       |
| `packages/i18n`     | Locale and direction primitives                            |
| `packages/database` | Generated DB types and separated Supabase client factories |
| `supabase`          | Core migrations, RLS policies, local config, and DB tests  |

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
enablement, shared media metadata, custom-domain claims, business locale state, minimal profiles,
and audit events. Non-exposed authorization helpers and platform super-admin assignments live in
`private`.

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

Shared media uses two platform buckets—images and videos—rather than tenant or engine buckets. UUID-
derived paths and Storage RLS bind uploads to a database reservation; kind-specific buckets enforce
the reviewed size/MIME ceilings, and completion rechecks stored metadata before activation. Public
read is deliberate for future QR-heavy delivery, while all writes remain authenticated and
permission-bound.

Custom-domain ownership is stored independently of routing infrastructure. Ordinary claim,
lifecycle, and primary mutations use the request-scoped authenticated client. Node DNS performs TXT
resolution server-side; only its boolean result crosses one service-key-backed, server-only
attestation RPC that rechecks the initiating user's `domains.manage` permission. No provider, SSL,
or public host routing is connected.

The module/capability registry is a shared platform concern, while future engines remain isolated
implementations. The current-business context loads RLS-visible capability state and provides a
server-side enablement gate. Capability enablement never replaces engine-specific authorization,
and no engine route or schema exists yet.

Splitting data services or introducing microservices requires demonstrated scale, security,
ownership, or operational needs; it is not a foundation goal.

## Deployment

The monorepo is Vercel-compatible. The intended production shape is one Vercel project per Next.js
application, connected to the same repository with its own application root, environment variables,
domain, and deployment lifecycle. Shared workspaces remain resolved through the root pnpm lockfile.

Preview and production secrets belong in deployment environment configuration, never in Git.

## Deferred decisions

- engine application names and subdomains;
- remote migration deployment and operational rollout;
- registration, invitations, password recovery, MFA, and detailed session policy;
- locale routing and fallback policy;
- public custom-host routing, Vercel domain attachment, and SSL automation;
- controlled physical media cleanup and image transformation;
- member, permission, platform-module-registry, and super-admin management interfaces;
- storefront/template runtime architecture;
- observability, queues, and background processing needs.

These decisions should be made when their requirements are concrete. No premature microservices or
empty engine applications should be introduced.
