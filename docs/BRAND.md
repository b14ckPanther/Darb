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

Main is the expressive, spatial brand north star. Admin is the quieter operational expression of
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
browser/PWA derivatives, and `brand/social` contains the localized share images (`darb-og-{ar,he,en}.jpg`),
composed by `apps/main/scripts/render-social-images.mjs` from the threshold scene masters, the
approved symbol raster, and the wordmark typography.

The canonical reusable React boundary is `@darb/ui`: `DarbMark`, `DarbWordmark`, and
`DarbBrandLockup` support mark-only, Arabic, Latin, bilingual, compact, light, dark, and accessible
forms. Its bundled mark (`packages/ui/src/assets/darb-mark.png`) is a 128px transparent-background
derivative of the approved symbol, not a redraw. Main retains the preserved high-resolution source
and complete derivative set. Active Darb-owned applications must consume these components or
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
| Muted       | `#56615B` |

Typography follows rendered script rather than page locale: Arabic glyphs use Cairo, Hebrew glyphs
use Heebo, and Latin glyphs use Ubuntu. Main's base font stack resolves unsupported scripts in that
order. Admin and Restaurant use the same deterministic script stack, while meaningful mixed-script
elements use explicit `lang` attributes. Page locale still owns document direction; it does not
force unrelated scripts into that locale's font. The corporate token set must not be merged with
tenant-controlled theme values; Darb branding and a business's storefront branding are different
trust and product boundaries.

## Cross-application use

Production navigation uses the trusted platform origins in `@darb/config/platform`; it never accepts
an arbitrary return origin. Main links to Admin sign-in and registration as real cross-origin
browser navigations, and links its Restaurant product entry to the Restaurant landing on
`rest.darb.co.il`. Admin login, chooser, tenant shell, and platform shell provide a subordinate
route back to Main. Darb-owned Restaurant system states may link to Main; a tenant Restaurant page
keeps its own identity and only the existing understated “Powered by Darb” path.

Motion creates continuity without faking cross-origin transitions. When a visitor follows a Main
link to Admin or Restaurant, a doorway of corridor light (`#F3D59B`) opens from the chosen link
while the browser performs an ordinary navigation; nothing is intercepted or delayed. Darb-owned
destination surfaces recognize a Darb referrer and fade the same light out as they appear.
Admin's sign-in, registration, and verification pages continue the route: their story panel shows
byte-identical copies of Main's threshold poster frames (`apps/admin/public/experience/threshold`),
one step further into the corridor. Same-origin navigations use cross-document view transitions. All of it is skipped under reduced
motion, and no state crosses the origin boundary. Fast operational interactions
stay in the 160–180ms range; a deliberate presentation transition may use the existing 320ms theme
contract. Reduced-motion preferences collapse nonessential animation, and no cross-domain session or
visual state is transferred.

## Public application

`apps/main` is Darb's public company/product experience. Its concept is "the route": the visitor
walks one continuous path through the Darb identity, and every important statement is real,
localized HTML.

- **Threshold (first viewport).** A procedural Three.js corridor of architectural doorways receding
  toward light. The doorway profile follows the approved hero architecture; it is scene geometry,
  not the mark. The scene is a progressive enhancement: pre-rendered poster frames
  (`public/experience/threshold`, AVIF and WebP) are the complete design, and the live scene loads
  only after idle on hover-capable, fine-pointer devices with hardware-accelerated WebGL, no
  reduced-motion preference, and no data-saver hint. Touch devices keep the poster with a
  compositor-only scroll dolly. The vanishing point sits toward the reading end (right of centre
  for LTR, left for RTL); the doorway itself is never mirrored.
- **Route and places.** Ivory "route" sections carry a gold route line that branches into the four
  engine destinations. Forest "places" (Restaurant, the three languages, arrival) open like a
  doorway as they enter the viewport. Motion uses CSS scroll-driven animation where supported and
  collapses to static states under reduced motion.
- **Truthful destinations.** Restaurant is the only available engine and links to the Restaurant
  landing; its section explains the real engine layers (menus, items and modifiers, per-location
  availability, hours, three languages, identity and address) and states that online ordering is
  not part of it yet. Booking, Pages, and Commerce are labeled coming soon and are not links.
- **Arrival.** The approved portrait hero master closes the page beside the Admin registration and
  sign-in actions.

Poster masters are lossless WebP files in `apps/main/art/threshold`, rendered from the live scene
by `apps/main/scripts/render-threshold-posters.mjs`; they are not served. No customer proof,
statistics, pricing, or unimplemented availability is invented.

## Browser and PWA identity

The manifest name is `Darb — درب`, its short name is `Darb`, and it starts at `/ar`. The deep-forest
background, theme color, Apple touch icon, 192/512 icons, and maskable icon all use the same
approved doorway mark. The manifest establishes installable identity only; no service worker or
offline cache is implemented.
