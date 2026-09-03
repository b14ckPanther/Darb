# Darb public brand

Status: the corporate brand implementation, localized Main website, cross-application identity, and
browser/PWA identity are implemented. This document governs Darb-owned brand surfaces; tenant
storefront themes remain a separate system.

## Identity levels

Darb uses three deliberately separate identity levels:

1. **Corporate identity** — the approved architectural-opening mark, bilingual Darb wordmark,
   script-aware typography, and forest/ivory/gold language used by Darb-owned surfaces.
2. **Product context** — concise labels such as Admin, Platform, or Restaurant that orient the user
   without creating a new logo or replacing the corporate mark.
3. **Tenant identity** — the business name, imagery, and controlled template/theme choices rendered
   in customer-facing experiences. Tenant identity must not be replaced with Darb corporate
   styling.

Main is the expressive, cinematic brand north star. Admin is the quieter operational expression of
the same identity. Platform Admin adds an unmistakable privileged context without adopting an
unrelated brand. Public Restaurant pages remain tenant-first; only Darb-owned landing, failure, and
browser identity use the corporate mark.

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

The canonical reusable React boundary is `@darb/ui`: `DarbMark`, `DarbWordmark`, and
`DarbBrandLockup` support mark-only, Arabic, Latin, bilingual, compact, light, dark, and accessible
forms. Its bundled mark is a byte-identical copy of the approved Phase 15 `icon-128.png` delivery
derivative (`b205db0d…` SHA-256 prefix), not a redraw. Main retains the preserved high-resolution
source and complete derivative set. Active Darb-owned applications must consume these components or
approved deterministic derivatives; CSS imitations and independent logo reinterpretations are
prohibited.

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
order. Admin and Restaurant use the same deterministic script stack, while meaningful mixed-script
elements use explicit `lang` attributes. Page locale still owns document direction; it does not
force unrelated scripts into that locale's font. The corporate token set must not be merged with
tenant-controlled theme values; Darb branding and a business's storefront branding are different
trust and product boundaries.

## Cross-application use

Production navigation uses the trusted platform origins in `@darb/config/platform`; it never accepts
an arbitrary return origin. Main links to Admin as a real cross-origin browser navigation. Admin
login, chooser, tenant shell, and platform shell provide a subordinate route back to Main. Darb-owned
Restaurant system states may link to Main; a tenant Restaurant page keeps its own identity and only
the existing understated “Powered by Darb” path.

Motion creates continuity without faking cross-origin transitions. Fast operational interactions
stay in the 160–180ms range; a deliberate presentation transition may use the existing 320ms theme
contract. Reduced-motion preferences collapse nonessential animation, and no cross-domain session or
visual state is transferred.

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
