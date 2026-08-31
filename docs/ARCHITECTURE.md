# Architecture

Status: accepted foundation direction. This document describes boundaries and deployment shape, not
implemented product capabilities.

## System shape

Darb begins as a modular monorepo managed by pnpm workspaces and Turborepo. Deployable surfaces use
the Next.js App Router and can be released independently while sharing reviewed platform packages.

| Area              | Responsibility                                              |
| ----------------- | ----------------------------------------------------------- |
| `apps/main`       | Public root-domain application for `darb.co.il`             |
| `apps/admin`      | Platform administration application for `admin.darb.co.il`  |
| `packages/config` | Shared build, lint, TypeScript, and platform constants      |
| `packages/types`  | Genuinely platform-wide type contracts                      |
| `packages/ui`     | Darb platform/admin UI foundation                           |
| `packages/icons`  | Curated icon and custom-SVG boundary                        |
| `packages/i18n`   | Locale and direction primitives                             |
| `supabase`        | Local configuration for the initial shared Supabase project |

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
and policy management coherent while the platform model is established. Tenant boundaries will be
enforced through server-side authorization and Row Level Security when a schema is approved.

The repository currently contains no schema, migrations, seed data, Edge Functions, or remote
database changes. Splitting data services or introducing microservices requires demonstrated scale,
security, ownership, or operational needs; it is not a foundation-phase goal.

## Deployment

The monorepo is Vercel-compatible. The intended production shape is one Vercel project per Next.js
application, connected to the same repository with its own application root, environment variables,
domain, and deployment lifecycle. Shared workspaces remain resolved through the root pnpm lockfile.

Preview and production secrets belong in deployment environment configuration, never in Git.

## Deferred decisions

- engine application names and subdomains;
- database schema and migration strategy details;
- authentication and permission implementation;
- locale routing and fallback policy;
- storefront/template runtime architecture;
- observability, queues, and background processing needs.

These decisions should be made when their requirements are concrete. No premature microservices or
empty engine applications should be introduced.
