# Darb public brand

Status: the corporate public brand implementation, localized Main website, and browser/PWA identity
are implemented. This document governs Darb-owned brand surfaces; tenant storefront themes remain a
separate system.

## Meaning and visual primitive

`Darb` / `درب` means path, way, or route. The approved symbol is an architectural opening or
doorway: it represents access to possible paths rather than one prescribed destination. The
corporate visual system combines deep forest green, warm ivory, restrained gold, architectural
geometry, depth, and light emerging through an opening.

The doorway is a permanent Darb brand primitive, not a disposable campaign motif. Future work must
reuse the canonical repository assets and must not regenerate or reinterpret the symbol from a text
prompt. A droplet, map pin, road, navigation arrow, generic `D`, or unrelated arch is not the Darb
mark.

## Authoritative inputs and production derivatives

The approved original assets are preserved at:

- `apps/main/public/brand/hero/darb-hero-desktop.png` — landscape hero master;
- `apps/main/public/brand/hero/darb-hero-mobile.png` — portrait hero master;
- `apps/main/public/brand/references/darb-logo-reference.png` — transparent visual reference that
  contains the approved symbol and bilingual wordmark.

The reference PNG is not described as a canonical vector master. The current production symbol is a
deterministic raster crop of the symbol pixels, with no redrawing or geometry change. Browser, PWA,
and social derivatives are deterministic scales/compositions of that same raster source. A future
brand-production task should supply a reviewed vector master before vector-only applications are
claimed.

Original PNGs must not be overwritten. Delivery-optimized WebP hero files live alongside their
masters. `brand/logo` contains the transparent symbol crop, `brand/icons` contains fixed-size
browser/PWA derivatives, and `brand/social` contains the approved-artwork share image.

## Corporate color and typography

The Main application owns the current corporate CSS tokens:

| Role        | Value     |
| ----------- | --------- |
| Forest      | `#123C2E` |
| Deep forest | `#09291F` |
| Gold        | `#DAA64D` |
| Soft gold   | `#F2E3BD` |
| Warm ivory  | `#FFFDF6` |
| Warm canvas | `#F2F0E9` |
| Deep canvas | `#E8E4DA` |
| Ink         | `#10241C` |
| Muted       | `#66716B` |

Typography follows rendered script rather than page locale: Arabic glyphs use Cairo, Hebrew glyphs
use Heebo, and Latin glyphs use Ubuntu. Main's base font stack resolves unsupported scripts in that
order, while meaningful mixed-script elements use explicit `lang` attributes. The corporate token
set must not be merged with tenant-controlled theme values; Darb branding and a business's
storefront branding are different trust and product boundaries.

## Public application

`apps/main` is Darb's public company/product experience. Its cinematic first viewport uses the
landscape and portrait masters through responsive art direction; localized messaging remains real
HTML. An opaque desktop veil covers the English copy embedded in the landscape artwork before
localized HTML is rendered above it.

The homepage tells one continuous story: the opening, Darb's modular foundation, different business
paths, the current Restaurant product, future product directions, shared platform capabilities,
multilingual value, and the truthful Admin sign-in action. No customer proof, statistics, pricing,
or unimplemented availability is invented.

## Browser and PWA identity

The manifest name is `Darb — درب`, its short name is `Darb`, and it starts at `/ar`. The deep-forest
background, theme color, Apple touch icon, 192/512 icons, and maskable icon all use the same approved
doorway mark. The manifest establishes installable identity only; no service worker or offline cache
is implemented.
