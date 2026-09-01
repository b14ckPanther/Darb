# Templates and themes

Status: the platform template registry, per-business appearance state, typed theme contract,
audited mutation boundary, admin preview/editor, and Restaurant customer renderer are implemented.

## Boundaries

- A **module/capability** says which functionality a business has enabled.
- A **template** is a platform-owned composition for one module rendering context.
- A **theme** is a closed set of semantic visual tokens applied to a template.
- A **vertical** is a business category and never selects a template or capability implicitly.

The customer-facing system is separate from the Darb platform/admin design system. `@darb/ui`
continues to own proven admin primitives; `@darb/theme` owns renderer-safe theme types, validation,
resolution, contrast checks, locale typography, reduced-motion behavior, and controlled CSS-variable
mapping. It accepts no arbitrary CSS, HTML, URLs, selectors, scripts, or property names.

## Registry and tenant state

`core.templates` is platform-owned reference data. A stable `key` belongs to one `module_key` and
has a display label, concise description, availability, ordering, template/theme schema versions,
and a complete validated default theme. Registry changes remain migration-managed. Tenant users
cannot create or edit template definitions.

`core.business_visual_settings` stores at most one row per `(business_id, module_key)` with the
selected template and a validated partial override document. No row means: use the available
platform default template and its default tokens. Selecting a different template does not mutate
the template definition. Disabling a module retains appearance state for a later re-enable.

If a selected template becomes unavailable, the row is retained and reads resolve to the available
default for that module. Unavailable templates cannot be newly selected. If no available default
exists, the application fails closed; `@darb/theme` also provides a renderer emergency fallback,
which is not a second source of platform template configuration.

The foundation registry contains two deliberately generic `pages` compositions—`foundation-canvas`
and `foundation-editorial`—only to prove the architecture and preview pipeline. They do not create a
pages engine, routes, public renderer, content model, or business content.

The registry also contains `restaurant-signature`, the platform-owned default composition for the
public Restaurant renderer. It is configuration, not tenant content. `apps/rest` resolves the
available selected/default Restaurant template and applies its validated defaults plus closed
tenant overrides on the server; invalid runtime payloads fall back to the renderer emergency theme.

## Token contract

Version 1 supports controlled semantic values for:

- colors: page/surfaces, primary/on-primary, accent, text hierarchy, border, and status colors;
- typography: approved weights, responsive scale, tracking, and line height;
- shape and depth: approved radius, border, density, and shadow presets;
- motion: reduced, subtle, or expressive intent, with user reduced-motion always taking precedence;
- limited layout: content width, section rhythm, hero treatment, and card image ratio.

Persisted colors use canonical `#RRGGBB`. Arabic resolves to Cairo, Hebrew to Heebo, and English to
Ubuntu; Arabic and Hebrew previews use RTL and suppress unsafe Latin tracking assumptions. The
database validates both the JSON shape and resolved critical contrast: primary text on page/surface
and on-primary over primary must meet 4.5:1. The editor may surface additional non-blocking contrast
review warnings.

## Authorization, lifecycle, and audit

Authorized members may read RLS-visible appearance state. Mutations require business-wide
`appearance.manage`, an active business, an effectively enabled/available module, and an available
template belonging to that module. Suspended and archived businesses cannot change appearance,
including through explicit super-admin authorization; they must be returned to active state first.

`core.set_business_appearance(...)` and `core.reset_business_theme_overrides(...)` derive the actor
from `auth.uid()`, use an empty `search_path`, validate again in Postgres, update state atomically,
and emit only actual transitions. Audit events are:

- `business.template_changed` with previous/new template keys;
- `business.theme_updated` with changed semantic token paths;
- `business.theme_reset` with module/template keys.

No-op saves/resets emit no duplicate event. Full override documents and arbitrary request payloads
are not copied into audit metadata. Ordinary application flows use the request-scoped RLS client,
never the privileged client.

## Admin and future rendering

`/b/[businessSlug]/appearance` is readable for an authorized business member and becomes editable
only with `appearance.manage`. It lists only rendering contexts backed by effectively enabled
modules and registered templates. Accessible hex/swatch controls validate canonical colors;
individual values, control groups, or all overrides can return to template defaults. The live
Arabic/Hebrew/English preview resolves the same template default + tenant override pipeline future
server-rendered customer experiences will consume.

A future engine route must separately require authenticated tenant access, effective module
enablement, and engine-specific permission. Appearance is presentation state, not authorization.

## Deferred

- customer-facing renderers beyond Restaurant, advanced cache invalidation, and SEO hardening;
- page-builder schema or UI and engine-specific content/configuration;
- template inheritance, tenant-authored templates, uploads, marketplace, or dependency graphs;
- themes connected to plans, billing, entitlements, or subscriptions;
- platform template-registry UI, advanced version migration tooling, and preview image assets.
