# Production foundations

Status: implemented for the current Main, Admin, and public Restaurant applications. Provider
activation and production monitoring policy remain deployment decisions.

## Search and canonical URLs

Restaurant metadata is built only from `public.get_restaurant_publication` and trusted domain
resolution. One canonical-origin rule is shared by canonical links, Open Graph URLs, language
alternates, structured data, and sitemaps:

1. a verified, live, primary Restaurant hostname is canonical;
2. another live hostname remains routable but canonicalizes to that primary hostname;
3. without a primary hostname, `https://rest.darb.co.il/{businessSlug}` is canonical.

Request `Host`, forwarded-host values, and location query parameters never become canonical input.
Enabled Arabic, Hebrew, and English locales receive `ar-IL`, `he-IL`, and `en-IL` alternates. The
canonical default-locale route is also `x-default` because Darb's locale-less route deliberately
resolves that locale.

The public Restaurant projection supplies titles, descriptions, safe media, exact prices, and
publication state. JSON-LD contains only facts present in that projection. Darb does not infer or
invent ratings, reviews, cuisine, hours, contact details, address structure, delivery, payment,
reservation, or location coordinates. Minor-unit integer prices are converted to decimal strings
without floating-point arithmetic. JSON-LD serialization escapes HTML-significant line content.

`public.list_public_restaurant_sitemap()` is a separate, anonymous-safe discovery projection. It
returns only canonical slug, default locale, enabled locales, and an optional trusted primary
hostname for active, publicly configured Restaurant businesses with an effective capability and
published content. It grants no anonymous table access. The platform sitemap excludes businesses
whose primary canonical origin is a custom hostname; only that primary host emits their sitemap.
Unresolved, non-primary, inactive, suspended, module-disabled, module-unavailable, private, or
draft-only states fail closed.

`darb.co.il` publishes the localized platform-level routes `/ar`, `/he`, and `/en`. Each route is
self-canonical and declares all three regional language alternates; `/` permanently redirects to
Arabic and is the `x-default` alternate. Main's sitemap lists only those real localized pages, and
its health endpoint is excluded from crawling. `admin.darb.co.il` is protected by page metadata,
`robots.txt`, and `X-Robots-Tag`. The Restaurant application landing is non-indexable, while valid
published tenant routes can be indexed.

## Analytics contract

`@darb/restaurant` owns a provider-neutral discriminated event contract and failure-isolated
dispatcher. Product components never call a vendor directly. The production baseline uses a no-op
adapter, performs no analytics network request, and persists no analytics data. A future provider
must be connected in the application-owned adapter boundary and reviewed for consent, retention,
regional privacy requirements, and failure behavior.

Current events and allowlisted payloads are:

| Event                              | Payload                             |
| ---------------------------------- | ----------------------------------- |
| `restaurant.page_viewed`           | whether a location is selected      |
| `restaurant.category_selected`     | category UUID                       |
| `restaurant.menu_item_opened`      | item UUID                           |
| `restaurant.locale_changed`        | destination supported locale        |
| `restaurant.location_changed`      | whether a location is selected      |
| `restaurant.outbound_link_clicked` | fixed `darb` destination identifier |

Every event includes the public business slug, resolved locale, and platform/custom route kind.
Descriptions, names, free-form URLs and queries, cookies, tokens, user identity, and other PII are
not event fields. Synchronous throws and rejected provider promises are swallowed at the adapter
boundary so analytics cannot interrupt the public experience.

## Logging and request errors

All three Next.js applications register `onRequestError`. Logs are single-line structured JSON with
an application key, stable event key, route template, request method/type, safe correlation ID when
available, and framework digest when valid. The logger never serializes the original error or
request headers. Context keys resembling credentials, tokens, cookies, passwords, raw payloads, or
publication data are removed; strings are control-character stripped and length bounded.

Restaurant domain-resolution and Admin domain-provider failures use the same safe reporter. Their
logs contain only normalized public resource identifiers and safe outcome codes—never provider
responses, authorization headers, or credentials. Client error boundaries show recovery actions
without internal details.

The Restaurant proxy replaces any inbound internal routing marker, supplies a fresh request ID, and
continues to reject direct internal paths and conflicting host/forwarded-host input. Correlation is
operational context, not identity or authorization.

## HTTP security policy

All applications send a shared, application-configured header baseline:

- CSP with self-only defaults, no objects or frames, `frame-ancestors 'none'`, constrained
  form/font/media/connect origins, and HTTPS upgrades in production;
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and DNS prefetch disabled;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- a restrictive Permissions Policy for camera, microphone, geolocation, payments, and USB.

The current Next.js HTML runtime, inline JSON-LD, and controlled theme variables require inline
script/style support in this static CSP. Production does not permit `unsafe-eval`; development does
for the Next.js toolchain. A request-nonce policy was not adopted because it would force dynamic
rendering across otherwise cacheable/static surfaces. This tradeoff must be revisited before adding
any third-party script or arbitrary script/style source.

Main and Admin emit one-year HSTS with subdomains in production for Darb-controlled platform hosts.
The Restaurant deployment does not emit HSTS from its shared response configuration because it also
serves tenant-owned custom hostnames whose HSTS ownership cannot be assumed. Platform-level TLS and
redirect behavior remains a deployment responsibility.

## Environment ownership

| Application | Browser-visible required variables                                 | Server-only conditional variables                                                                                                                  |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main        | none                                                               | none                                                                                                                                               |
| Admin       | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_SECRET_KEY` for narrow attestation; `DARB_VERCEL_API_TOKEN` and `DARB_VERCEL_RESTAURANT_PROJECT_ID`, plus optional `DARB_VERCEL_TEAM_ID` |
| Restaurant  | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | none                                                                                                                                               |

Public Supabase configuration is normalized to an HTTP(S) origin without credentials, path, query,
or fragment; a Supabase secret key is rejected at this boundary. Admin validates server-only values
only when their trusted operation is used. Main and Restaurant never require Admin's provider or
Supabase secret. `VERCEL_URL` remains a legitimate Vercel-provided preview-host signal. The reserved
legacy custom names `VERCEL_API_TOKEN`, `VERCEL_RESTAURANT_PROJECT_ID`, and `VERCEL_TEAM_ID` are not
accepted.

## Health, performance, and accessibility

Each application exposes `GET /health`, returning only a service identifier and `status: ok` with
`Cache-Control: no-store`. This is process/application liveness, not database/provider readiness; it
does no privileged or tenant-specific work.

Main is a static, database-independent public surface with no runtime environment variables. Its hero
uses media-aware source selection so clients fetch one optimized WebP composition: the approved
portrait artwork below the desktop breakpoint and the approved landscape artwork above it. The
original raster masters remain preserved. Browser and installable-app identity uses deterministic
derivatives of the approved Darb symbol through a manifest and favicon metadata; no offline service
worker or deployment cache was introduced.

The public Restaurant path remains RSC-first. A request loads one curated publication graph, and
React request memoization prevents metadata/layout/page duplication from becoming repeated database
queries. Host resolution is exact and request-scoped. The only public interactive client boundary
coordinates item dialogs and typed analytics. There is no third-party script. Responsive Next Image
delivery uses an allowlisted public media path, explicit `sizes`, hero priority, and lazy loading for
non-critical images.

Performance regression rules are: no N+1 publication reads, no provider script without measured
budget review, no global tenant cache, no unbounded public payload, and no client conversion of the
RSC shell. Accessibility release checks cover keyboard paths, focus visibility/restoration, dialog
Escape behavior, semantic landmarks/headings, touch-sized controls, Arabic/Hebrew RTL, English LTR,
reduced motion, 200% text reflow, long content, image alternatives, and horizontal overflow. These
checks are engineering validation, not a claim of formal certification.

Platform operator lists are Server Component views backed by bounded database projections.
Businesses, users, domains, and audit use 25-row pages, deterministic ordering, and server-side
filters; the browser never downloads the full estate. The platform shell reuses the existing
focus-managed responsive drawer and does not introduce a chart or client data-grid dependency.

## Deferred operations

- production analytics provider selection, consent policy, and analytics reporting;
- external error/trace vendor, alert routing, SLOs, and dependency probes;
- CSP nonce/SRI adoption if future script requirements justify the rendering cost;
- background sitemap submission and search-console operations;
- certificate monitoring, domain-provider webhooks, and automated DNS changes.
