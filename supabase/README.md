# Supabase workspace

This directory contains Darb's local Supabase configuration, version-controlled migrations, and
database tests. The hosted project reference is `xtuhwpyqxgmsthgumktk`; the reference is an
identifier, not a credential.

The migrations establish the `core` tenant schema, isolated `restaurant` engine schema, and
non-exposed `private` authorization schema, plus narrowly granted anonymous `public` functions for
Restaurant publication, host resolution, and discovery. They also install deterministic platform
registries: modules, permissions, plans and plan entitlements, templates, and module media roles.
They do not seed tenant, menu, booking, commerce, page, user, or branding data.

Use these root commands for local development:

```bash
pnpm supabase:start
pnpm db:reset
pnpm db:lint
pnpm db:test
pnpm db:types
pnpm supabase:stop
```

`db:reset` rebuilds the local database from migrations and is intentionally destructive only to the
local development database. Database tests run through pgTAP and roll back their fixtures. Type
generation targets only the exposed `core`, `public`, and `restaurant` schemas; `private` is
deliberately absent from browser-shareable database types.

Linking to, migrating, resetting, or changing a remote project is a separate deliberate operation.
Every remote project's Data API exposed schemas must include `core` and `restaurant` to match
`config.toml`; `private` must remain unexposed. Verify applied migrations with
`supabase migration list` before and after each remote deployment.
