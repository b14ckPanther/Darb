# Darb / درب

Darb is the foundation of a multi-tenant, multi-product business platform for the Israeli market.
The repository provides the engineering baseline, RLS-first core tenancy model, and initial secure
admin authentication/onboarding flow for future product development. It does not yet implement
business engines or customer workflows.

The platform is organized as a pnpm/Turborepo monorepo with separate Next.js applications for the
public root domain and platform administration, shared packages for true platform concerns, and a
local Supabase workspace prepared for a future approved data model.

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
supabase/     Local configuration, versioned core migrations, and database tests
docs/         Accepted architecture and engineering direction
tests/e2e/    Playwright public-shell and admin auth/onboarding flows
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

Vitest covers locale primitives plus auth input and redirect decisions. Playwright exercises the
public shell and the complete local admin sign-in/onboarding/sign-out flow. The E2E command starts
local Supabase when needed and provides only its ephemeral configuration to the test processes:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Current status

This repository has completed the monorepo, core database, and initial admin authentication
foundations. It includes workspace orchestration, two deployable application shells, shared package
boundaries, migration-driven tenancy, RLS authorization, atomic first-business bootstrap, secure
SSR session handling, protected admin routes, generated database types, database isolation tests,
and focused auth/onboarding UI.

No tenant records or business-specific restaurant, booking, commerce, billing, page, storefront, or
theme functionality has been implemented. The checked-in module and permission rows are deterministic
platform registries, not tenant content.

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
- [`docs/TENANCY.md`](./docs/TENANCY.md)
- [`docs/I18N.md`](./docs/I18N.md)
- [`docs/SECURITY.md`](./docs/SECURITY.md)
