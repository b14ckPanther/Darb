# Darb / درب

Darb is the foundation of a multi-tenant, multi-product business platform for the Israeli market.
The repository provides the engineering baseline, RLS-first core tenancy model, secure admin
authentication/onboarding, and a unified tenant-admin environment for core business, location,
capability, media, custom-domain, language, and appearance administration. It does not yet
implement business engines or customer workflows.

The platform is organized as a pnpm/Turborepo monorepo with separate Next.js applications for the
public root domain and platform administration, shared packages for true platform concerns, and a
local Supabase workspace whose approved core model is rebuilt entirely from versioned migrations.

## Repository structure

```text
apps/
  main/       Minimal Next.js shell for darb.co.il
  admin/      Supabase-authenticated admin shell for admin.darb.co.il
packages/
  config/     Shared TypeScript, ESLint, and platform configuration
  i18n/       Supported-locale and text-direction primitives
  icons/      Governed icon and custom-SVG boundary
  types/      Platform-level TypeScript types
  ui/         Minimal platform/admin UI accessibility foundation
  database/   Generated database types and explicit Supabase client boundaries
  theme/      Closed semantic theme contract and deterministic resolver
supabase/     Local configuration, versioned core migrations, and database tests
docs/         Accepted architecture and engineering direction
tests/e2e/    Playwright public-shell and authenticated admin workflows
```

There is intentionally no `@darb/utils` package yet. It should be created only when a real,
cross-workspace utility exists. Future engine applications will be introduced deliberately rather
than scaffolded speculatively.

## Prerequisites

- Node.js 22 or newer
- pnpm 11.24.0 (pinned in `package.json`)
- Docker-compatible container runtime only when running the local Supabase stack
- PostgreSQL `psql` client only when running the local auth E2E fixture cleanup

## Installation

```bash
pnpm install
```

Environment templates are committed at the repository root and in each application. Copy the
relevant `.env.example` to an ignored local environment file when credentials are available. Never
commit real secrets. The checked-in Supabase project reference is a non-secret identifier; all key
values remain empty.

## Development

```bash
# Run all persistent development tasks
pnpm dev

# Run one application
pnpm --filter @darb/main dev
pnpm --filter @darb/admin dev

# Start the optional local Supabase stack
pnpm supabase:start

# Rebuild the local database from migrations and run its tests
pnpm db:reset
pnpm db:test
pnpm db:types
```

The local applications use ports `3000` (main) and `3001` (admin).

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:lint
```

Vitest covers locale primitives, validators, routing, permission decisions, DNS-result mapping, and
media/domain state helpers. Playwright exercises the public shell and local admin flows including
auth, tenant switching, core settings, modules, media upload, DNS claims, language settings, and
fixture cleanup. The E2E command starts local Supabase when needed and provides only its ephemeral
configuration to the test processes:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Current status

This repository has completed the monorepo, core database, authentication, platform-resource,
theme/appearance, and unified tenant-admin foundations. It includes migration-driven tenancy, RLS
authorization, atomic first-business bootstrap, protected multi-business routes, audited core
mutations, shared image/video Storage coordination, DNS-verified domain claims, business locale
state, generated database types, database isolation tests, typed permission/module-aware navigation,
real-state setup guidance, and responsive accessible admin interaction patterns.

No tenant records or business-specific restaurant, booking, commerce, billing, page, storefront,
or customer-facing engine runtime has been implemented. The checked-in module, permission, and
template rows are deterministic platform registries, not tenant content.

## Engineering direction

Darb prioritizes polished multilingual UX, accessibility, performance, strict tenant isolation,
clear engine boundaries, and professional change history. Shared code must represent proven
platform concerns rather than hypothetical reuse.

The permanent engineering rules live in [`AGENTS.md`](./AGENTS.md). Accepted foundation decisions
are documented in:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/AUTH.md`](./docs/AUTH.md)
- [`docs/DATABASE.md`](./docs/DATABASE.md)
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)
- [`docs/DOMAINS.md`](./docs/DOMAINS.md)
- [`docs/MEDIA.md`](./docs/MEDIA.md)
- [`docs/TENANCY.md`](./docs/TENANCY.md)
- [`docs/I18N.md`](./docs/I18N.md)
- [`docs/SECURITY.md`](./docs/SECURITY.md)
