# Modules and capabilities

Status: the platform registry, per-business state, audited mutation boundary, server-side feature
gates, and tenant administration surface are implemented. The Restaurant domain exists without an
admin/public runtime; the other product engines remain unimplemented.

## Vocabulary and ownership

- An **engine** is a major product implementation with its own domain logic and future data model.
- A **module/capability** is platform-defined functionality that a business may enable.
- A **template** is platform-owned visual composition managed by the separate appearance system.
- A **theme override** is validated per-business presentation configuration, also managed by the
  appearance system.
- A **vertical** describes a business category; it is never a capability identifier.

`core.modules` is the canonical platform-owned registry. Stable machine keys drive logic; migration-
controlled display names, concise descriptions, availability, and sort order support administration.
Tenant users cannot create or edit registry rows. Registry changes remain migration-managed until a
separate platform-super-admin workflow is designed.

The current keys are `restaurant`, `booking`, `pages`, and `commerce`. Restaurant now has an
isolated domain schema, but enablement still creates no data or route. The other keys remain
capability vocabulary only.

## Business state

`core.business_modules` has one optional row per business and module key. The canonical rules are:

- no row means disabled;
- `is_enabled = false` is an explicit disabled state retained after a prior enable;
- the primary key prevents duplicate business/module rows;
- a business remains valid with zero enabled modules;
- enablement is administrative capability state, not a plan, subscription, or entitlement.

`core.modules.is_available` controls new enablement. If the platform makes a module unavailable, an
existing enabled row is retained for operational clarity but is not considered effectively enabled
by application feature gates. It may still be disabled. Adding a future capability requires a
registry migration, not a new column on `core.businesses`.

## Mutation and lifecycle

`core.set_business_module_enabled(business_id, module_key, enabled)` is the sole normal tenant
mutation boundary. It derives the actor from `auth.uid()`, requires business-wide `modules.manage`,
validates the platform key, locks the business row, changes state, and writes its audit event in the
same transaction. Direct authenticated inserts and updates are revoked.

Repeated enable or disable requests return the current state with `changed = false`; they create no
duplicate row and no audit event. Actual transitions emit `business.module_enabled` or
`business.module_disabled` with only the module key and previous/new boolean state.

Tenant admins may mutate capabilities only while a business is active. A platform super admin may
handle a suspended business through the same authenticated database authorization, but no such UI
exists. Archived businesses must be reactivated before any module change, including by a super
admin.

## Application gate

The server loads the RLS-visible registry and business state into the current-business context.
`businessHasModule` and `requireBusinessModule` provide the future server-side capability gate. An
effective module requires an active business, an available registry definition, and enabled tenant
state. A future engine route must additionally authenticate the user and require its own action
permission: module enablement never grants authorization.

The `/b/[businessSlug]/modules` surface is readable by authorized business members. Mutation controls
appear only with `modules.manage` on an active business. It deliberately offers no engine launch
links.

Module enablement provides the context in which templates may be selected, but it does not select a
template, grant `appearance.manage`, or create engine data. Disabling a module retains its visual
settings for a possible later re-enable; an unavailable module is excluded from effective
appearance resolution.

Restaurant mutations require the effective capability and separate `restaurant.manage`
authorization. Disabled or unavailable state retains domain rows for authorized historical reads.
See [`RESTAURANT.md`](./RESTAURANT.md).

## Deferred

- Restaurant admin/public routes and other engine-specific schemas, permissions, and configuration;
- module dependencies or a dependency graph;
- billing, plans, subscriptions, and entitlement reconciliation;
- template dependencies across modules, advanced template composition, and vertical classification;
- platform-super-admin registry UI and module marketplace behavior;
- localization of platform module labels and descriptions.
