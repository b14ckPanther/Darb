# Security principles

Status: foundation policy. Controls tied to business workflows will be implemented with those
workflows, not simulated in advance.

## Data access

Supabase security will be RLS-first. Every tenant-owned table must have Row Level Security enabled
with policies derived from an explicit ownership and permission model. Database policy is the final
data boundary; API handlers and server actions must also authorize requests server-side to provide
clear failures and defense in depth.

Use least privilege for users, services, CI, deployments, and operators. Hiding a control in the UI
does not authorize or protect its underlying action. Elevated access must be narrow, intentional,
and kept out of browser code.

## Secrets and environments

- Never commit API keys, tokens, passwords, database URLs containing credentials, or signing keys.
- Browser code may use only the Supabase publishable key and still relies on correct RLS.
- Supabase secret keys and legacy service-role keys are server-only because they bypass RLS.
- Keep local, preview, and production values in their respective secret managers or ignored local
  files.
- Treat logs, fixtures, screenshots, and error reports as possible secret-exposure paths.

The project reference `xtuhwpyqxgmsthgumktk` is a non-secret identifier. Its presence does not grant
database access.

## Application boundaries

Validate and normalize every external input at a trusted boundary. Encode output for its context,
use parameterized data access, and avoid exposing internal errors. Authentication establishes user
identity; authorization must separately prove tenant, location, resource, and action access.

Dependency updates, framework configuration, redirects, uploads, webhooks, and future integrations
require security review proportional to their risk.

## Controls added with future workflows

Sensitive public flows will be rate-limited and abuse-aware when those endpoints exist. Sensitive
administrative operations will produce durable audit events when their model exists. Future work
should also define session policy, content-security policy, upload validation, retention, recovery,
monitoring, and incident response as concrete surfaces require them.

## Verification

Security-relevant changes must include tests for denied access, not only successful paths. Tenancy
tests must attempt cross-business and out-of-scope location access. Schema changes must review RLS,
grants, indexes used by policies, migration behavior, and rollback or recovery expectations as one
unit.

No database schema, policy, rate limiter, billing control, or audit implementation exists in the
foundation phase.
