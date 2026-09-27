# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Israeli business owners and operators (Arabic-, Hebrew-, and English-speaking) who are deciding
  whether Darb can run the digital side of their business, starting with food businesses.
- Existing Darb account holders returning to sign in to Admin.
- Reviewers, partners, and engineers evaluating Darb as a company and as a portfolio piece.

## Product Purpose

`darb.co.il` is Darb's public company surface. It must let a first-time visitor understand, within
seconds, what Darb is, who it is for, what works today (Restaurant), what is coming later (Booking,
Pages, Commerce, and more), and how to start (Admin registration) or sign in (Admin login).

## Positioning

Darb (`درب`, path / way / route) is one multi-tenant platform powering many kinds of businesses
through specialized engines: "One platform. Many businesses. Many paths." Each engine is shaped
around how its industry works while sharing identity, locations, languages, appearance, domains,
and media underneath.

## Operating Context

- Public, indexable, localized routes `/ar` (default), `/he`, `/en`; `/` redirects to `/ar`.
- Cross-origin handoff to `admin.darb.co.il/login|register?locale=<locale>` and to the Restaurant
  landing `rest.darb.co.il/<locale>`. These are ordinary navigations, never faked SPA transitions.
- Visitors arrive on phones as often as desktops; Arabic and Hebrew are RTL, English is LTR.

## Capabilities and Constraints

- Restaurant is the only available engine: curated multilingual menus, categories, items, variants
  with absolute prices, reusable modifier groups, per-location sold-out overrides, weekly opening
  hours, public location profiles, logo/hero media, database-registered presentation templates,
  custom domains. Ordering is intentionally absent.
- Booking, Pages, Commerce are future directions and must be labeled as coming soon.
- Main must not change database, auth, entitlement, or Restaurant business logic.
- No hardcoded business data (no invented restaurants, menus, prices, customers, metrics).

## Brand Commitments

- Approved doorway mark and bilingual wordmark via `@darb/ui`; never redrawn or regenerated.
- Deep forest, warm ivory, restrained gold; architectural geometry; light through an opening.
- Cairo (Arabic), Heebo (Hebrew), Ubuntu (Latin), selected by rendered script.
- Hugeicons first through `@darb/icons`; no emoji.
- Conversational Palestinian/Levantine Arabic voice already established in `lib/copy.ts`.

## Evidence on Hand

- Approved hero masters and WebP derivatives in `public/brand/hero`, mark crop in `public/brand/logo`,
  logo reference, PWA icons, OG image.
- No customer logos, testimonials, statistics, or pricing exist; none may be fabricated.

## Product Principles

1. Honesty over spectacle: availability, capabilities, and claims must match the repository.
2. The idea of a path is felt through space and movement, not only stated.
3. Three languages are designed simultaneously, not translated afterward.
4. Meaning and navigation never depend on a canvas, script, or animation.

## Accessibility & Inclusion

WCAG 2.1 AA; keyboard and touch parity; visible focus; 200% text reflow; reduced motion; RTL/LTR
composition; decorative 3D hidden from assistive technology.
