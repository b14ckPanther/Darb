# Design system direction

Status: accepted principles; the complete design system and theme engine are not implemented.

## Two distinct systems

Darb will maintain a deliberate separation between:

1. **Platform/admin design system** — the consistent operational interface used across Darb-owned
   administration and platform tools. Its primitives belong in `@darb/ui` when they are proven to
   be shared.
2. **Customer-facing storefront/template/theme system** — the future presentation layer used by
   tenant-facing experiences. It must support controlled brand expression without leaking arbitrary
   tenant styling into administration surfaces.

These systems may share low-level accessibility knowledge and selected technical primitives, but
they must not be forced into one visual language or one unrestricted component API. The theme
engine will be designed in a later phase.

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
matte-surface business shell, a route-backed business switcher, focused navigation, form and status
states, and reusable page-level admin patterns. These remain inside `apps/admin` until reuse is
demonstrated; they have not been prematurely promoted to `@darb/ui`.

This is a scoped operational foundation, not the final dashboard or a complete component catalogue.
No storefront template, tenant theme, analytics experience, theme engine, or page builder exists.
