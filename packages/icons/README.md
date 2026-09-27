# `@darb/icons`

This package is the single product-facing boundary for Darb icons and custom SVG artwork.

- Hugeicons is the default icon family.
- Lucide may be used when it is a better semantic or visual fit. It is not currently a dependency;
  add it here deliberately when the first such icon is needed.
- Custom SVG icons and illustrations are welcome when they improve the product's distinction.
- Product code must not use emojis as icon fallbacks.
- New exports should be curated here; applications should not assemble unrelated icon families.

The package exports a curated Hugeicons set used by the Main, Admin, Platform, and Restaurant
interfaces. Every export renders through one wrapper with a fixed 1.7 stroke width and is
`aria-hidden` and non-focusable, so icons are decorative by default; the surrounding control or
text must provide the accessible name. Add icons deliberately as real interface needs emerge; do not
export an entire family wholesale.
