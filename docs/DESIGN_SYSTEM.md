# Design system direction

Status: accepted admin principles, the first controlled customer-facing theme contract, and the
Restaurant customer-facing renderer are implemented. The complete design system is not.

## Two distinct systems

Darb will maintain a deliberate separation between:

1. **Platform/admin design system** — the consistent operational interface used across Darb-owned
   administration and platform tools. Its primitives belong in `@darb/ui` when they are proven to
   be shared.
2. **Customer-facing storefront/template/theme system** — the future presentation layer used by
   tenant-facing experiences. It must support controlled brand expression without leaking arbitrary
   tenant styling into administration surfaces.

These systems may share low-level accessibility knowledge and selected technical primitives, but
they must not be forced into one visual language or one unrestricted component API.

`@darb/theme` establishes the second system's closed semantic token contract, resolver,
contrast validation, locale typography, motion intent, and CSS-variable mapping. Platform template
definitions and tenant overrides are database-driven. These primitives do not move tenant styling
into `@darb/ui` and do not constitute a page builder.

## Product quality bar

Darb should feel premium, modern, distinctive, smooth, highly polished, and commercially credible.
The system should avoid generic library defaults and generic SaaS-dashboard composition. Components
must solve real Darb workflows, expose complete interaction states, and work across mobile, tablet,
laptop, and large desktop.

Accessibility requirements include semantic structure, keyboard operation, visible focus,
appropriate labeling, sufficient contrast, touch-friendly targets, and robust zoom/reflow behavior.

## Typography

The approved families are Cairo for Arabic, Heebo for Hebrew, and Ubuntu for English. Type tokens
must account for script-specific hierarchy, weight availability, spacing, line height, readable
measure, responsive scaling, and mixed RTL/LTR runs. Font delivery must avoid unnecessary variants
and visible layout shift.

## Icons and illustration

All product iconography is governed through `@darb/icons`. Hugeicons is preferred; Lucide is used
when appropriate. Custom SVG work is encouraged when it adds coherent distinction. Emoji icons and
careless family mixing are prohibited. Icon color, size, stroke, alignment, interactive state, and
accessibility semantics must be tokenized or otherwise consistent.

## Motion and performance

Motion should clarify state, hierarchy, or spatial relationships. It must remain subtle where
appropriate, use performant properties, and respect reduced-motion preferences.

Design reviews include loading behavior and rendering cost. Images require responsive sizing,
compression, and appropriate formats. Components should prevent layout shift, avoid unnecessary
client JavaScript, load fonts efficiently, and use skeletons only when they improve perceived
progress.

## Current implementation

The admin application now provides script-aware font loading, an accessible skip link, a responsive
matte-surface business shell, a route-backed business switcher, grouped selected-state navigation,
compact page headers, semantic statuses, lifecycle notices, page-shaped loading, empty/error/
read-only states, and a focus-managed confirmation dialog. These admin-orchestration components
remain inside `apps/admin` until cross-application reuse is demonstrated; they have not been
prematurely promoted to `@darb/ui`.

The Overview presents real RLS-visible platform state and actionable readiness categories; it does
not manufacture engine metrics, charts, or completion percentages. This is a scoped operational
foundation, not an analytics dashboard or a complete component catalogue.
The admin Appearance surface is a scoped editor/preview for the implemented contract. The public
Restaurant renderer consumes it with server-resolved locale direction, responsive media, reduced
motion, and 200% text-reflow behavior. No analytics dashboard, advanced template engine, or page
builder exists. See [`THEMES.md`](./THEMES.md) and [`PRODUCTION.md`](./PRODUCTION.md).
