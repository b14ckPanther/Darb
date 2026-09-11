# Restaurant launch operations

Status: Darb can onboard and operate an initial Restaurant customer through governed product and
Platform Admin paths. This runbook is the pre-launch and first-customer operating contract; it is
not a promise of ordering, billing, or holiday-scheduling features.

## Launch decision

The launch audit classified missing canonical location hours and public contact details as P0.
Those are now stored per canonical `core.locations` row, edited through one authorized Restaurant
RPC, and exposed only inside the curated public publication. The Admin readiness surface, trusted
public-menu link, full-week public hours, current open/closed state, and factual SEO projection are
P1 work completed with that boundary.

The following are safe post-launch P2 work: exceptional/holiday hours, password reset and broader
account recovery, automated menu import or bulk editing, physical media deletion/transformation,
advanced analytics, background reconciliation, and automated monitoring integrations. Operators
must account for these limitations during onboarding.

## Go-live criteria

A Restaurant is ready when all required Admin readiness checks are satisfied:

- Restaurant configuration exists and public activation is intentional;
- the business has an active location;
- an active menu, category, and item exist, with a published menu and at least one visible item in
  an enabled locale;
- every active location has regular opening hours;
- at least one public locale is enabled;
- the business has explicitly selected a Restaurant template.

Public address plus contact details and logo/hero media are recommended, not hard publication
blocks. Modifiers are optional. The checklist is derived from canonical server data and exposes no
fabricated score. Restaurant availability still requires an active business, a globally available,
entitled and enabled Restaurant module, public activation, and the existing publication gates.

## First-customer runbook

1. Ask the owner to register through the localized Darb site and complete email verification.
2. Complete first-business setup; confirm the `restaurant-starter` policy, owner permissions, first
   active location, and intended public locales in Admin.
3. In **Restaurant → Hours & contact**, add regular hours for every active location. Overnight
   service is one interval whose close time is earlier than its open time. Add only customer-safe
   phone, email, HTTPS website/map, and WhatsApp details.
4. Upload described logo, hero, and menu imagery through Media, then assign branding in Appearance.
5. Create the menu, categories, items, translations, prices, optional variants/modifiers, and
   location availability. Keep unfinished menus in draft.
6. Select Signature, Editorial, or Counter and inspect the public menu in every enabled language.
7. Resolve all required readiness items and review recommended ones. Then intentionally activate
   the Restaurant experience; do not create a second or fake Publish state.
8. Use **View public menu**. It resolves a verified live primary custom hostname when one exists,
   otherwise the trusted `rest.darb.co.il` platform URL. Never paste an arbitrary host into Admin.
9. If a custom domain is required, complete the governed ownership and provider-routing workflow,
   make the correct live domain primary, and verify HTTPS, canonical, alternate-language, robots,
   sitemap, and JSON-LD behavior.
10. Smoke-test mobile and desktop: navigation, location choice, hours, contacts, sold-out items,
    item details, images/video fallback, keyboard focus, RTL/LTR, and browser console.
11. After launch, recheck the public route, canonical domain, email delivery, `/health`, and recent
    audit activity. Document any holiday closure manually with the customer until exceptional
    hours are implemented.

If support is needed, Platform Admin can inspect business lifecycle, commercial/effective access,
module state, domains, locales, Restaurant configuration/content totals, appearance, setup state,
and recent audit activity, then enter the real business workspace as the operator. Do not forge a
membership, impersonate a user, expose draft data publicly, or edit tenant rows with SQL for normal
support. Restrictive changes use the existing governed and audited controls.

## Opening hours and public information

`restaurant.location_opening_intervals` stores ISO weekday, local opening time, and local closing
time for each canonical location. Multiple intervals represent split service; no row represents a
closed day. A close time before its open time crosses midnight. Overlapping intervals—including
overlaps across Sunday/Monday—are rejected by the database. Runtime status is evaluated in the
location timezone with `Intl`, so Israel daylight-saving changes are not encoded as fixed UTC
offsets. Special/holiday exceptions are not implemented.

`restaurant.location_public_profiles` stores only allow-listed customer contact values. Phone and
WhatsApp use E.164, email is normalized, and website/map links must be credential-free HTTPS URLs.
Core location address fields remain canonical. Archived locations are immutable and inactive or
archived locations are absent from the public publication. With several active locations, the
public page displays each location; a valid selected location narrows availability, contact,
hours, and location-specific JSON-LD. Without a selection, JSON-LD does not invent a single address
or telephone for a multi-location business.

The normalized tables make launch data backup/exportable through the normal database backup
strategy. They do not place customer content in opaque workflow blobs. There is no public or tenant
browser write path to either table.

## Production checklist

- All Vercel projects build and `/health` returns the expected non-privileged liveness response.
- Required per-app environment variables from `PRODUCTION.md` exist; no secret is browser-visible.
- Hosted Supabase is backed up, migrations are current, RLS/grants are verified, Storage buckets
  and public-delivery policy are correct, and restore procedures are known.
- Auth Site URL and allow-listed Admin confirmation redirects use production HTTPS origins.
- Production confirmation mail has an approved sender, branding, resend/rate-limit policy, and
  monitored delivery. The sending domain publishes aligned SPF and DKIM; deploy and monitor a DMARC
  policy appropriate to the domain. Supabase template localization limits are understood and the
  invalid/expired-link recovery copy has been tested.
- `darb.co.il`, `admin.darb.co.il`, and `rest.darb.co.il` DNS/SSL are healthy. Every customer custom
  domain is verified, provider-live, target-module correct, and primary only after it routes.
- Restaurant Starter assignment and effective access are confirmed through Platform Admin. No
  tenant receives entitlement or permissions through manual SQL.
- Public menu, canonical, hreflang, Open Graph, JSON-LD, robots, and sitemap are checked after every
  domain or publication change.
- Error logs and audit events are reviewed through the documented redacted observability boundary;
  an operator and escalation path are assigned. Health is liveness, not a privileged dependency
  probe.

## Failure and recovery

Menu, appearance, media, localization, availability, and location-public-detail writes retain the
existing deterministic action-state pattern: pending controls prevent duplicate submission,
success revalidates affected routes, and a safe localized error restores the control. Equivalent
hours/contact retries are explicit no-ops and emit no duplicate audit event. Entitlement loss or
voluntary module disable removes public/effective access without deleting Restaurant content.

Unknown tenants, mismatched custom hosts, invalid locales/locations, inactive businesses,
unavailable or unentitled modules, disabled modules, inactive public configuration, and absent
published content all fail closed through the same non-diagnostic public unavailable experience.
Operators use authenticated diagnostics and redacted audit logs for the underlying reason.
