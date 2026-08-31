# Security principles

Status: foundation policy with Phase 2 database authorization controls implemented. Controls tied
to future business workflows remain deferred until those workflows exist.

## Data access

Supabase security is RLS-first. Every `core` table and `private.super_admins` has Row Level Security
enabled with explicit policies. Database policy is the final data boundary; future API handlers and
server actions must also authorize requests server-side to provide clear failures and defense in
depth.

Table grants are opt-in and column-limited for authenticated mutations. Anonymous users receive no
access to `core` or `private`. The `private` schema is not exposed through the Data API. Its small
security-definer helper set uses schema-qualified objects, an empty `search_path`, no dynamic SQL,
and narrowly granted execution to avoid recursive RLS policies and search-path substitution.

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

## Privileged boundaries

`private.super_admins` holds explicit, revocable platform authorization and is separate from tenant
membership. Normal clients cannot read or mutate it. A Supabase secret or legacy service-role key
bypasses RLS as a technical capability; it does not create a super-admin product identity and must
be limited to audited, trusted server paths.

`@darb/database/browser` and `@darb/database/server` accept publishable keys. The privileged factory
is a separate `server-only` export, disables session persistence and refresh behavior, and requires
its secret explicitly. No application uses it yet.

## Application boundaries

Validate and normalize every external input at a trusted boundary. Encode output for its context,
use parameterized data access, and avoid exposing internal errors. Authentication establishes user
identity; authorization must separately prove tenant, location, resource, and action access.

Dependency updates, framework configuration, redirects, uploads, webhooks, and future integrations
require security review proportional to their risk.

## Audit foundation

`core.audit_events` is append-oriented and records actor kind, optional authenticated actor,
optional business scope, action key, optional entity reference, metadata, and `timestamptz`. Normal
authenticated clients can only read authorized business events with `audit.view`; they cannot write
events. Trusted service paths can append but cannot update, delete, or truncate through the
service-role grant. Application workflows must define redaction and metadata allowlists before
emitting sensitive values.

## Controls added with future workflows

Sensitive public flows will be rate-limited and abuse-aware when those endpoints exist. Sensitive
administrative operations will use the audit-event foundation when their server workflows are
implemented. Future work should also define session policy, content-security policy, upload
validation, audit retention, recovery, monitoring, and incident response as concrete surfaces
require them.

## Verification

Security-relevant changes must include tests for denied access, not only successful paths. Current
pgTAP coverage changes session roles and JWT subjects to exercise RLS for two tenant users, a super
admin, and anonymous access. It verifies cross-business denial, location scope, mutation denial,
permission self-escalation denial, super-admin self-promotion denial, audit isolation, and module
isolation. Fixtures are transaction-scoped and rolled back.

Schema changes must review RLS, grants, indexes used by policies, migration behavior, and recovery
expectations as one unit. Rate limiting, billing controls, and workflow-specific audit emission do
not exist yet.
