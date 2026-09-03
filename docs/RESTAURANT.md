# Restaurant Engine foundation

Status: the Restaurant Engine database domain, authenticated tenant administration, and curated
customer-facing menu experience are implemented. Ordering remains intentionally absent.

## Boundary and capability

Restaurant is a product engine under `restaurant.*`. Canonical tenant identity, locations, users,
memberships, media, domains, locales, currency, templates, and themes remain in `core.*` and are
referenced rather than duplicated. The domain is suitable for restaurants, cafés, bakeries,
dessert shops, food trucks, bars, and similar food businesses.

The platform-owned `restaurant` module remains the capability gate. Enabling it creates no
configuration or content. An absent `restaurant.configurations` row means unconfigured and not
publicly active. Disabling the module or making it unavailable retains Restaurant data for
authorized historical reads, while every mutation is blocked. Capability state is not user
authorization and is not billing entitlement.

## Entity model

Every tenant-owned table carries `business_id` directly. Composite foreign keys preserve that
ownership through all relationships.

| Entity                                  | Responsibility                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `restaurant.configurations`             | Optional one-per-business operational public-activation state                          |
| `restaurant.menus`                      | Multiple ordered menu containers with draft/published and active/archived state        |
| `restaurant.categories`                 | Ordered menu sections with optional shared image reference                             |
| `restaurant.items`                      | Ordered category entries with base price, visibility, availability, and optional image |
| `restaurant.item_variants`              | Ordered choices with independent absolute prices and availability                      |
| `restaurant.modifier_groups`            | Reusable business-wide customization groups                                            |
| `restaurant.modifiers`                  | Ordered group options with non-negative price deltas and availability                  |
| `restaurant.item_modifier_groups`       | Item/group assignment plus item-specific selection constraints                         |
| `restaurant.item_location_availability` | Optional per-location item availability override                                       |
| six `*_translations` tables             | Customer-facing names and supported descriptions by entity and locale                  |

Menus are not restricted to one row per business. Categories are constrained to their declared
menu; items are constrained to their declared menu and category. Modifier groups are reusable
within one business, and their minimum/maximum selection rules live on each item assignment. This
allows the same group to be optional on one item and required on another.

## Localization

Menu, category, item, variant, modifier-group, and modifier customer-facing names use dedicated
relational translation tables. Menus, categories, items, and modifier groups may also carry a
localized description. Operational `internal_name` values remain on their canonical entities for
administration and are not the public fallback contract.

Locale codes use `core.locale_code`; `(business_id, locale_code)` references
`core.business_locales`. A locale must be enabled when a translation is created or changed.
Disabling it later retains existing content. Primary keys enforce one translation per entity and
locale. The public renderer resolves the requested enabled locale, then falls back per entity to
the business default and remaining enabled Darb locales in stable platform order. There is no JSON
translation blob or generic EAV translation store.

## Pricing, variants, and modifiers

All monetary values are `bigint` integer minor units in the currency owned by
`core.businesses.currency_code`; Restaurant rows do not duplicate currency. Values must be between
zero and `999999999`.

- `items.base_price_minor` is the absolute price of the default/no-variant item.
- `item_variants.price_minor` is an absolute variant price, never a delta from the base.
- `modifiers.price_delta_minor` is a non-negative amount added to the selected item or variant.

Negative prices and floating-point money are prohibited. Discounts, tax rules, coupons, and
currency conversion are deferred because they require ordering policy.

An item/group assignment uses `minimum_selections` and `maximum_selections`. A minimum above zero
makes the group required; a maximum above one permits multiple selections. The database enforces
non-negative minimums, positive maximums, a maximum of 100, and `minimum <= maximum`.

## Media, branding, and locations

Category and item images reference `core.media_assets` through `(business_id, id)`. A trigger
accepts only an active image owned by the same business at attachment time. Later media archival
retains the reference for history; renderers must treat archived media as unavailable. Restaurant
stores neither upload paths nor storage identity.

Customer-facing Restaurant branding uses the shared, module-aware media-assignment boundary rather
than adding media columns to Restaurant content or appearance JSON. The platform registry currently
governs two Restaurant roles: `logo` accepts images, while `hero` accepts images or video.
`core.business_media_assignments` references the canonical business module, governed role, and
existing `core.media_assets` row through tenant-aware keys. The database accepts only active,
same-business assets of a role-compatible kind. Assign, replace, and remove use the idempotent
`core.set_business_media_assignment(...)` RPC and emit redacted audit events only for actual
changes.

`item_location_availability` references canonical `core.locations` and stores only an explicit
`available` or `sold_out` override. An absent row inherits the item's base availability. This does
not model inventory, quantities, schedules, or another Restaurant location entity.

## Publication and lifecycle

The domain deliberately keeps separate concerns:

- module state determines whether the business has an effective Restaurant capability;
- configuration public activation is an engine-wide operational switch;
- menu `draft`/`published` is publication intent;
- entity visibility controls customer presentation without removing content;
- `available`/`sold_out` is temporary operational availability;
- `active`/`archived` is retained lifecycle history.

Normal mutation functions do not hard-delete content entities. Archived entities are immutable.
Assignment and location-override rows may be removed explicitly because absence has defined
inheritance semantics. Suspended and archived businesses must return to `active` before Restaurant
mutation, including for a platform super admin.

## Permissions, RLS, and mutation API

The minimal business-scoped permission pair is `restaurant.read` and `restaurant.manage`.
`restaurant.manage` does not imply module enablement, and location-scoped platform permissions do
not imply Restaurant access. First-business bootstrap now grants both keys in its fixed twelve-key
owner bundle. The migration backfill extends only active memberships holding the complete approved
ten-key Phase 8 owner bundle; custom and partial memberships are not broadened.

All 15 tenant tables have RLS and an authenticated SELECT policy for either Restaurant permission.
Authenticated direct writes are withheld and no anonymous table policy exists. Authorized reads
remain available after module or business lifecycle changes for retained administration/history.
Anonymous public delivery crosses only the curated `public.get_restaurant_publication(text)`
projection described below.

The authenticated mutation API is intentionally explicit:

- `save_configuration`, `save_menu`, `save_category`, `save_item`, `save_item_variant`;
- `save_modifier_group`, `save_modifier`, and fixed-branch `save_translation`;
- `set_item_modifier_group` and `remove_item_modifier_group`;
- `set_item_location_availability`, where `null` removes the override.

Each security-definer function derives `auth.uid()`, uses an empty `search_path`, schema-qualifies
objects, requires `restaurant.manage`, locks and requires an active business, and requires an
enabled and platform-available Restaurant module. Parent resources are re-resolved inside the
target business. Create-or-update functions generate IDs server-side for creates, return explicit
`created`/`changed` results, and make unchanged requests no-ops. There is no dynamic SQL, arbitrary
actor input, generic JSON command, privileged browser client, or service-role tenant RPC grant.

## Audit and performance

Actual mutations append allowlisted events to `core.audit_events` in the same transaction. Stable
families cover configuration, menu/category/item/variant/modifier-group/modifier creation, update,
availability and archive transitions, translation saves, modifier assignments, and location
availability changes. Metadata contains identifiers, locale, selection bounds, and lifecycle or
availability states only—never names, descriptions, prices, media paths, or full payloads. No-op
requests emit no event.

Read indexes follow the future menu shape: business and ordered menu state, ordered categories,
ordered items, variants, modifiers, item/group assignments, translation locale lookups, and
location overrides. Composite keys support set-based menu loading without speculative
denormalization or N+1-only access patterns.

## Restaurant Admin

Restaurant Admin is statically contributed to the authenticated business shell when the
`restaurant` capability is effectively enabled and the caller has `restaurant.read` or
`restaurant.manage`. Its routes are:

- `/b/[businessSlug]/restaurant` for real content totals, operational configuration, and actionable
  readiness;
- `/b/[businessSlug]/restaurant/menus` and `/menus/[menuId]` for multiple-menu structure,
  publication intent, categories, items, media references, and localized content;
- `/b/[businessSlug]/restaurant/items/[itemId]` for item details, variants, modifier assignments,
  and per-location availability;
- `/b/[businessSlug]/restaurant/modifiers` for the reusable modifier-group and option library.

Pages are Server Components backed by set-based RLS-visible queries. Interactive forms are narrow
client components whose Server Actions re-resolve the authenticated business and Restaurant access
before calling the existing audited RPCs. Ordinary tenant administration never uses the privileged
client or writes Restaurant tables directly. Business switching preserves only the Restaurant
section root, so resource identifiers from one tenant never carry into another.

`restaurant.read` provides useful read-only administration. Mutation controls require
`restaurant.manage`, an active business, and an effectively enabled capability. A disabled
capability redirects its stale admin route to the business Overview; unavailable capabilities and
retained suspended/archived data remain readable but immutable. The interface distinguishes
internal operational names from localized customer content and follows each locale's native
direction.

The Overview uses stored Restaurant state only. It reports real menus, categories, items,
publication state, languages, images, modifiers, sold-out items, and location overrides. Readiness
is a deterministic list of required or recommended actions, not a fabricated percentage or engine
KPI. Public activation remains an operational intent flag and is clearly distinguished from menu
publication, capability enablement, and public-route eligibility.

## Public Restaurant experience

`apps/rest` is a dedicated Next.js customer-facing engine application intended for
`rest.darb.co.il`. Platform-slug routes are `/{businessSlug}` for the business default locale and
`/{businessSlug}/{locale}` for another enabled locale. An optional, validated `location` query
selects one projected active location; unknown tenant, locale, or location contexts fail closed.
Verified live custom domains resolve by exact host through an anonymous-safe routing projection and
reuse this same renderer. Platform-slug routes remain available; canonical origin prefers the
primary live Restaurant hostname and otherwise remains on `rest.darb.co.il`.

The server makes one anonymous request to `public.get_restaurant_publication`. The security-definer
function has an empty `search_path`, a narrow `anon`/`authenticated` execute grant, and returns
`null` unless the business is active, the Restaurant module is enabled and available, Restaurant is
publicly active, and an available Restaurant template resolves. It exposes only render-safe
identity, enabled locales, active locations, resolved appearance, published visible content,
active media fields, governed Restaurant branding, variants/modifiers, and location overrides.
Internal names, original filenames, actors, audit data, and administration timestamps are not in
the contract. Raw Restaurant and media-assignment tables remain protected by their existing RLS and
grants.

The `restaurant-signature` platform template is the current default Restaurant composition. The
server validates its theme document, applies closed tenant overrides through `@darb/theme`, and
emits controlled CSS variables with Cairo, Heebo, or Ubuntu according to locale. The renderer is
Server Component-first; one small client controller owns native item-dialog opening, Escape,
backdrop close, and focus restoration. A full menu arrives as one set-based projection, so the UI
does not issue per-category/item queries.

Assigned tenant media is resolved alongside—but remains separate from—the selected template and
theme tokens. An assigned logo replaces the template Restaurant symbol. An assigned hero image or
muted inline video takes precedence over the existing first-content-image fallback; the template
motif remains the final fallback. Archived assignments fail closed at projection time. Video uses
metadata-only preload, exposes a localized play/pause control, and does not autoplay for reduced-
motion users. Public Restaurant identity remains tenant-first; Darb corporate artwork is not used
as tenant branding.

Customer presentation separates base price, absolute variant prices, non-negative modifier deltas,
and sold-out availability without implying cart selection. JSON-LD describes only factual
Restaurant/Menu/MenuItem/Offer state. Canonical, Open Graph, language-alternate, JSON-LD, and
sitemap URLs use the trusted primary live custom hostname or the platform slug fallback; location
query state never creates a canonical duplicate. A narrow public sitemap projection discovers only
effective, published Restaurants without opening raw tenant tables.

The interactive controller emits a small typed event taxonomy through an application-owned
provider adapter. The current adapter is deliberately no-op, sends no network request, and stores
no analytics. Event payloads contain only public context plus fixed booleans or entity UUIDs—not
names, descriptions, URLs, queries, identity, or credentials. See
[`PRODUCTION.md`](./PRODUCTION.md).

## Application boundary and deferred work

`@darb/restaurant` exposes generated row/enum aliases plus pure helpers for capability
effectiveness, projection parsing/localization, exact minor-unit formatting, location availability
inheritance, and modifier selection semantics. It has no React or Supabase client abstraction.
`@darb/database/anonymous` creates a stateless publishable-key client for the owning server runtime;
it does not expose a privileged key.

`@darb/restaurant` additionally exposes exact major-to-minor money parsing and pure readiness
derivation. It still has no React or Supabase client abstraction. Admin-specific queries, actions,
validation, and presentation stay inside `apps/admin`; `@darb/database` remains the generated
schema/client boundary.

The current product does not include carts, checkout, orders, payments, delivery, tables,
kitchen/POS, inventory, taxes, coupons, loyalty, tips, schedules, custom-domain routing for engines
beyond Restaurant, or a public template marketplace.
