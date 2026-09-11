# Plans and entitlements

Darb's commercial authorization foundation is provider-neutral and price-free. It records which
platform capabilities a business may use, without implementing billing, checkout, subscriptions,
invoices, trials, payment providers, or enforcement based on payment state.

## Effective access

Module state is intentionally composed from five independent facts:

1. **Available** — `core.modules.is_available` says the platform can offer the capability.
2. **Entitled** — the current business plan includes it, unless a platform override grants or
   denies it explicitly.
3. **Enabled** — `core.business_modules.is_enabled` records the tenant's operational choice.
4. **Configured** — the engine owns its own configuration/content readiness.
5. **Effective** — the business is active and the capability is available, entitled, and enabled.

No one boolean substitutes for the others. Losing entitlement or platform availability makes a
capability ineffective without deleting its enabled state, appearance, domains, media assignments,
or engine data.

## Data model

- `core.plans` is the platform-owned plan registry. Its labels and limits are metadata; application
  display text never authorizes access.
- `core.plan_module_entitlements` is the closed plan-to-module inclusion set.
- `core.business_plan_assignments` stores exactly one current plan per business.
- `core.business_module_entitlement_overrides` stores a reasoned platform `grant` or `deny` that
  takes precedence over plan inclusion.
- `core.business_initial_setup_services` tracks optional assisted setup independently from access.

Authenticated clients may read the platform plan registry. Per-business assignments, overrides,
and setup-service rows have no direct Data API grant; tenant and platform applications consume only
the allowlisted member or super-admin projections below.

The initial arrangements are `core-only` and `restaurant-starter`. Both deliberately carry no
price and no location limit. `restaurant-starter` includes Restaurant; `core-only` includes no
engine. Existing Restaurant-enabled tenants are assigned `restaurant-starter` during migration,
while other existing tenants retain core access. Every newly created business starts on
`core-only`; the database-owned first-business onboarding policy may upgrade it to
`restaurant-starter` only when the user selects the currently offered Restaurant path.

## Enforcement and operations

`private.resolve_business_module_entitlement` resolves override precedence and plan inclusion.
`private.business_has_effective_module_access` composes tenant lifecycle, platform availability,
entitlement, and stored enablement. Both are private, server/database-only helpers.

Member-facing snapshots come from `core.get_business_module_access` and
`core.get_business_commercial_summary`. Tenant operators may enable only an entitled capability,
and Restaurant mutations, appearance/media mutations, public publication, exact-host routing,
canonical custom-domain resolution, and sitemap discovery all fail closed when Restaurant is not
effective.

Platform super admins use narrow authenticated RPCs to inspect plans and tenant commercial state,
assign plans, manage reasoned overrides, and advance valid setup-service transitions. Each actual
change is audited. Business managers may only request initial setup; they cannot accept, complete,
or self-assign the service.

`max_locations` is a nullable plan limit. `null` means unlimited. When a future arrangement sets a
positive limit, Postgres serializes location creation against the business and also guards
reactivation, preventing concurrent or archived-row bypasses. Changing to a lower limit never
deletes existing locations; it blocks additional activation until usage is within the allowance.

## Deferred

Prices, currencies for plans, coupons, trials, recurring billing, invoicing, taxes, payment
providers, webhooks, collections, metering, add-ons, proration, entitlement expiry, and automated
access changes remain unimplemented. A future billing provider must reconcile into these canonical
platform-controlled assignments rather than becoming the authorization source itself.
