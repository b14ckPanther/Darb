# Restaurant Engine foundation

Status: the Restaurant Engine database domain, authorization vocabulary, audited mutation boundary,
generated types, and pure domain helpers are implemented. Restaurant Admin, public menu delivery,
and ordering remain intentionally absent.

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
locale. Runtime locale negotiation and deterministic fallback are Phase 11 concerns; there is no
JSON translation blob or generic EAV translation store.

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

## Media and locations

Category and item images reference `core.media_assets` through `(business_id, id)`. A trigger
accepts only an active image owned by the same business at attachment time. Later media archival
retains the reference for history; renderers must treat archived media as unavailable. Restaurant
stores neither upload paths nor storage identity.

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
Authenticated direct writes are withheld, anonymous roles have no schema/table/function access,
and no anonymous public menu policy exists. Authorized reads remain available after module or
business lifecycle changes for retained administration/history. Phase 11 must introduce a separate
safe public read model rather than expose these administration tables.

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

## Application boundary and deferred work

`@darb/restaurant` exposes generated row/enum aliases and pure helpers for capability effectiveness,
public activation, location availability inheritance, and modifier selection semantics. It has no
React or Supabase client abstraction. `@darb/database` remains the generated schema/client boundary.

Phase 10 may build Restaurant Admin against the authenticated RPCs. Phase 11 may design explicit
public menu queries, publishing, fallback, caching, and presentation. This phase does not include
admin or public routes, carts, checkout, orders, payments, delivery, tables, kitchen/POS, inventory,
taxes, coupons, loyalty, tips, schedules, or translation UI.
