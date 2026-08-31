# Darb / درب

Darb is the foundation of a multi-tenant, multi-product business platform for the Israeli market.
The repository currently provides the engineering baseline for future product development; it does
not yet implement business engines or customer workflows.

The platform is organized as a pnpm/Turborepo monorepo with separate Next.js applications for the
public root domain and platform administration, shared packages for true platform concerns, and a
local Supabase workspace prepared for a future approved data model.

## Repository structure

```text
apps/
  main/       Minimal Next.js shell for darb.co.il
  admin/      Minimal Next.js shell for admin.darb.co.il
packages/
  config/     Shared TypeScript, ESLint, and platform configuration
  i18n/       Supported-locale and text-direction primitives
  icons/      Governed icon and custom-SVG boundary
  types/      Platform-level TypeScript types
  ui/         Minimal platform/admin UI accessibility foundation
supabase/     Local Supabase configuration; no schema or business data
docs/         Accepted architecture and engineering direction
tests/e2e/    Playwright smoke specifications for both applications
```

There is intentionally no `@darb/utils` package yet. It should be created only when a real,
cross-workspace utility exists. Future engine applications will be introduced deliberately rather
than scaffolded speculatively.

## Prerequisites

- Node.js 22 or newer
- pnpm 11.24.0 (pinned in `package.json`; Corepack is recommended)
- Docker-compatible container runtime only when running the local Supabase stack

## Installation

```bash
corepack enable
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
```

The local applications use ports `3000` (main) and `3001` (admin).

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Vitest currently covers the shared locale/direction primitives. Playwright smoke tests are ready for
both applications and can be run after installing Chromium:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Current status

This repository is at the platform-foundation phase. It includes workspace orchestration, strict
tooling, two minimal deployable application shells, shared package boundaries, testing setup,
documentation, and local Supabase configuration.

No business-specific features, database schema, tenant records, commerce, billing, booking, content
engine, or theme engine has been implemented.

## Engineering direction

Darb prioritizes polished multilingual UX, accessibility, performance, strict tenant isolation,
clear engine boundaries, and professional change history. Shared code must represent proven
platform concerns rather than hypothetical reuse.

The permanent engineering rules live in [`AGENTS.md`](./AGENTS.md). Accepted foundation decisions
are documented in:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)
- [`docs/TENANCY.md`](./docs/TENANCY.md)
- [`docs/I18N.md`](./docs/I18N.md)
- [`docs/SECURITY.md`](./docs/SECURITY.md)
