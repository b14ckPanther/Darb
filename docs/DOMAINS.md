# Custom domains

Status: DNS ownership, explicit public-engine targeting, provider-attested deployment routing, one
primary hostname per business/target, and Restaurant host routing are implemented. Production
activation still requires deployment secrets, the Phase 12 migration, and an attached Vercel
Restaurant project.

## Ownership and routing are separate

`core.business_domains` retains the Phase 6 ownership lifecycle (`pending`, `verified`, `failed`,
`disabled`) and DNS TXT proof. Phase 12 adds a nullable `target_module_key` and a separate routing
lifecycle:

- `unconfigured` — ownership may be verified, but no deployment connection is active;
- `provisioning` — provider attachment exists while DNS, verification, or TLS is incomplete;
- `live` — a trusted provider check attested the project assignment ready;
- `failed` — the provider boundary could not attest a safe deployment;
- `disconnected` — Darb routing is disabled while the ownership claim remains retained.

Legacy claims remain unassigned and unconfigured. No existing verified hostname is silently
converted to Restaurant. Changing target, restarting ownership verification, disabling ownership,
or disconnecting deployment clears live/primary state. Disabling a capability or making it
platform-unavailable retains domain history but the anonymous resolver fails closed.

Only an active, verified, live domain may be primary. The invariant is one primary hostname per
business and target module. Non-primary live hostnames remain accessible but canonicalize to the
primary hostname; without a primary, canonical URLs fall back to `rest.darb.co.il/{businessSlug}`.

## Trusted mutations and provider boundary

Normal target, connect-request, disconnect, and primary actions use the request-scoped authenticated
client and require business-wide `domains.manage`. Provider readiness cannot be asserted by the
browser. A server-only Vercel adapter calls the official project-domain/configuration APIs and maps
responses to `live` or `needs-configuration`, plus provider-recommended DNS records. Raw provider
payloads and errors are never persisted or returned.

The service-key client submits only domain ID, initiating user ID, and a reviewed routing outcome.
Postgres rechecks current permission, active business, verified ownership, target, module
enablement, and module availability. Disconnect revokes Darb routing before provider cleanup.
Provider failures emit structured server logs containing only normalized hostname, implemented
module target, operation, and a stable safe error category. Credentials, proof tokens, response
bodies, and tenant publications are excluded; successful requests are not logged.

Production server-only variables are `DARB_VERCEL_API_TOKEN`, `VERCEL_RESTAURANT_PROJECT_ID`, optional
`VERCEL_TEAM_ID`, and `SUPABASE_SECRET_KEY` for the narrow attestation RPCs.
`DARB_DOMAIN_PROVIDER=fake` and `DARB_LOCAL_DOMAIN_ROUTING=enabled` are local/E2E controls;
production rejects the fake provider and local/IP hosts.

## Runtime resolution

`apps/rest` keeps `/{businessSlug}` and `/{businessSlug}/{locale}`. Its Next.js Proxy recognizes
platform/preview hosts and normalizes one authoritative Host value. Multi-value, conflicting
forwarded, credential/path, malformed, IP/local production, and reserved `darb.co.il` hosts fail
closed. A valid custom host is internally rewritten; the internal route cannot be invoked directly.

`public.resolve_public_domain(text)` returns only hostname, business slug, implemented target, and
canonical hostname. It requires verified ownership, live routing, an active business, and an
enabled/available Restaurant capability. It never returns business UUIDs, ownership tokens, or
provider/admin detail. `public.get_restaurant_publication(text)` independently enforces Restaurant
publication gates.

Custom `/`, `/{locale}`, and `?location=<uuid>` routes reuse the Phase 11 renderer, projection,
theme, metadata, JSON-LD, and interactions. There is no second Restaurant implementation.

Host and primary-origin lookups use React request memoization keyed by the normalized hostname or
business slug. They do not use a process-global tenant cache, so one request cannot reuse another
tenant's resolution. Provider reads bypass HTTP caching; longer-lived cache invalidation remains
deferred until a concrete production traffic policy is established.

## Audit and deferrals

Target changes, connection requests, routing activation/failure, disconnect, primary movement, and
ownership transitions are audited with allowlisted identifiers only—never tokens, credentials, raw
provider responses, or DNS payloads.

Pages, Booking, and Commerce public routing are not implemented. Wildcards, apex/www redirect
automation, provider webhooks, background polling/retry, DNS mutation, certificate monitoring, and
domain purchase/renewal remain deferred.
