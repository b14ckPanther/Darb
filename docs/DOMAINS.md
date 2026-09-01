# Custom domains

Status: canonical domain claims, DNS TXT ownership verification, primary designation, audit, and
tenant administration are implemented. Production routing/provider automation is not implemented.

## Claim model

`core.business_domains` belongs directly to a business and stores a globally unique normalized
hostname, lifecycle, server-generated verification token/method, check/verification timestamps,
primary flag, creator, and timestamps.

States are:

- `pending` — waiting for the current TXT proof;
- `failed` — the last authoritative check did not contain the exact proof;
- `verified` — the last successful check proved DNS control;
- `disabled` — retained historical claim, not eligible for primary use.

A failed or disabled claim may restart verification, which creates a new cryptographically random
token, clears verification timestamps/primary state, and returns to pending. Domain mutations are
blocked while a business is archived or platform-suspended.

## Hostname rules

Input is lowercase, trailing-dot-free ASCII. The application converts IDNs with the runtime
`domainToASCII` implementation before the database repeats structural validation. Protocols, paths,
ports, user-info, whitespace, IP literals, localhost/single-label names, malformed labels, and
overlong hostnames are rejected.

`darb.co.il` and every subdomain beneath it are permanently reserved, covering current and future
platform hosts without maintaining a fragile list. Normalized hostnames are unique platform-wide.

## DNS verification

The required TXT record is:

```text
Name:  _darb-verification.<hostname>
Value: darb-verification=<64-hex-token>
```

The token is generated in Postgres and cannot be supplied by a tenant caller. Server-only Node DNS
performs an exact TXT match with a four-second timeout. TXT chunks are joined according to DNS API
semantics; NXDOMAIN/no-data records an honest failed check, while resolver/timeouts leave state
unchanged so a transient outage does not become a false failure.

Ordinary claim/restart/primary/disable actions use the normal RLS-bound client. DNS evidence requires
one narrow service-only RPC because external resolver evidence cannot be trusted from a browser. The
server passes only the domain ID, initiating authenticated user ID, and boolean outcome; the RPC
rechecks that user's current `domains.manage` permission or explicit super-admin status. It never
accepts a token, and audit metadata never stores one.

## Primary and routing readiness

Only verified claims may be primary. A partial unique index guarantees at most one primary per
business, and primary movement clears the former row and sets the target in one transaction.
Disabling a primary clears designation while retaining history.

Server helpers normalize/reserve hosts, identify a verified hostname, and select the business's
verified primary claim. They do not alter public request routing. Vercel Domains API integration,
DNS-provider mutation, certificate/SSL automation, public custom-host routing, redirects, and domain
renewal monitoring remain deferred.
